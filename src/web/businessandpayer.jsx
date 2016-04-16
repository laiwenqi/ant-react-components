import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm,Icon, Button,Dropdown,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;

//定义类型
const utype=[{ text: '商户', value:'T_MERCHANT'},
             { text: '支付方', value:'T_PAYMENT'}];

//类型下拉列表
const utypeList=utype.map(function(item){
  return (<Option value={String(item.value)} >{item.text}</Option>)
});

//指定表格每列内容
const columns = [{
  title: '编号',
  dataIndex: 'MHPY_CODE'
},{
  title: '全名',
  dataIndex: 'MHPY_FULL_NAME'
},{
  title: '行业',
  dataIndex: 'MHPY_INDUSTRY'
},{
  title: '类型',
  dataIndex: 'MHPY_TYPE',
  render(text, row, index) {
    return utype.map(function(item){
      if(item.value==row.MHPY_TYPE){
        return (item.text);
      }
    });
  }
},{
  title: '操作',
  key: 'operation',
  render(text, row, index) {
    return (
      /* 把所在的行的数据传递下去 */
      <Edit {...row}/>
      );
    }
}];





//这里是默认简易的搜索
const SearchInput = React.createClass({
  getInitialState() {
    return {
      FILTER_KEY: '',
      focus: false,
    };
  },
  handleInputChange(e) {
    this.setState({
      FILTER_KEY: e.target.value,
    });
  },
  handleFocusBlur(e) {
    this.setState({
      focus: e.target === document.activeElement,
    });
  },
  handleSearch(e) {
    let params={};
    params.FILTER_KEY=this.state.FILTER_KEY.trim();
    params.type="defaultSearch";
    if (this.props.onSearch) {
      this.props.onSearch(params);
    }
  },
  render() {
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.FILTER_KEY.trim(),
    });
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    });
    return (
      <InputGroup className={searchCls} style={this.props.style}>
        <Input {...this.props} value={this.state.FILTER_KEY} onChange={this.handleInputChange}
          onFocus={this.handleFocusBlur} onBlur={this.handleFocusBlur} />
          <div className="ant-input-group-wrap">
            <Button className={btnCls} size={this.props.size} onClick={this.handleSearch}>
              <Icon type="search" />
            </Button>
          </div>
        </InputGroup>
    );
  }
});





//这里是高级的搜索
let FilterLayer = React.createClass({
  getInitialState() {
    return {
    };
  },
  handleSubmit(e) {
    e.preventDefault();
    let params=this.props.form.getFieldsValue();
    params.type='moreSearch';
    this.props.search(params);
    this.props.fliterhide();
  },
  handleReset(e) {
    e.preventDefault();
    this.props.form.resetFields();
  },
  render() {
const { getFieldProps } = this.props.form;
    return (
  <Form horizontal inline onSubmit={this.handleSubmit} className="advanced-search-form advanced-search-o">
    <Row>
      <Col span="8">
        <FormItem
          label="选择性别："
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}>
          <Select placeholder="请选择性别" style={{ width: 120 }} {...getFieldProps('EMPL_SEX')}>
            <Option value="0">女</Option>
            <Option value="1">男</Option>
          </Select>
        </FormItem>
      </Col>
    </Row>
    <Row>
      <Col span="8" offset="16" style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">搜索</Button>
        <Button onClick={this.handleReset}>清除条件</Button>
      </Col>
    </Row>
  </Form>
    );
  }
});
FilterLayer = Form.create()(FilterLayer);







//点击操作编辑 弹窗内容
let ModalContent =React.createClass({
  getInitialState() {
    return {
      loading:false,//确定按钮状态
      nochangecontentV:this.props.contentValue,//这个用来对比是不是和原来的值一样，暂时用这个办法
      contentV:this.props.contentValue
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
    }
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        console.log('表单没通过验证');
        return;
      }
        /*判断弹窗表单值是否有改变，没有就不发布更新*/
       /*！！两个对象长度不等可能会导致不正确判断*/
       let aProps = Object.getOwnPropertyNames(values);
       let bProps = Object.getOwnPropertyNames(this.state.nochangecontentV);
       let hasChanged=0; /*0表示没有改变*/
         for (let i = 0; i < aProps.length; i++) {
           let propName = aProps[i];
           if (values[propName] != this.state.nochangecontentV[propName]) {
             hasChanged=1;
          }
         }
       if(hasChanged==0){
         this.handleCancel();
         return;
       }
      let params=commonFunction.objExtend({MHPY_ID:this.state.nochangecontentV.MHPY_ID},values);
      //发布 编辑 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish("businessandpayerEdit",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  getValidateStatus(field) {
   const { isFieldValidating, getFieldError, getFieldValue } = this.props.form;
   if (isFieldValidating(field)) {
     return 'validating';
   } else if (!!getFieldError(field)) {
     return 'error';
   } else if (getFieldValue(field)) {
     return 'success';
   }
 },
 checkMhpyCode(rule, value, callback){
     if(this.state.nochangecontentV.MHPY_CODE==value){
       callback();
       return;
     }
    //  if(!/^[A-Z]([0-9]|[a-zA-Z])$/.test(value)){
    //    setTimeout(() => { callback(new Error('类型编号只能以大写字母开头，且是两个字符组合'))}, 800);
    //    return;
    //  }
     if(!value||!value.trim()){
         callback();
     }else {
       reqwest({
         url:web_config.http_request_domain+'/proc/businessandpayer/checkmhpycode',
         method: 'POST',
         timeout :web_config.http_request_timeout,
         data:{
           MHPY_CODE:value
         },
         crossOrigin:web_config.http_request_cross, //跨域
         type: "json",
         success: (result) => {
           if(result.data.exist==1){
             /*加延时防止闪烁*/
             setTimeout(() => { callback(new Error('编号已存在'))}, 800);
           }else{
             setTimeout(() => {callback()}, 800);
           }
         },
         error:() => {
           setTimeout(() => {callback()}, 800);
           callback(new Error('编号校验失败'));
         }
       });
     }
 },
 checkMhpyFullName(rule, value, callback){
     if(this.state.nochangecontentV.MHPY_FULL_NAME==value){
       callback();
       return;
     }
     if(!value||!value.trim()){
         callback();
     }else {
       reqwest({
         url:web_config.http_request_domain+'/proc/businessandpayer/checkmhpyfullname',
         method: 'POST',
         timeout :web_config.http_request_timeout,
         data:{
           MHPY_FULL_NAME:value
         },
         crossOrigin:web_config.http_request_cross, //跨域
         type: "json",
         success: (result) => {
           if(result.data.exist==1){
             /*加延时防止闪烁*/
             setTimeout(() => { callback(new Error('全名已存在'))}, 800);
           }else{
             setTimeout(() => {callback()}, 800);
           }
         },
         error:() => {
           setTimeout(() => {callback()}, 800);
           callback(new Error('全名校验失败'));
         }
       });
     }
 },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;编号： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}
        help={isFieldValidating('MHPY_CODE') ? '校验中...' : (getFieldError('MHPY_CODE') || []).join(', ')}>
        <Input placeholder="请输入编号" {...getFieldProps('MHPY_CODE',{
            rules: [{ required: true,whitespace:true, message: '请输入编号' },{validator: this.checkMhpyCode}],
            initialValue:this.state.contentV.MHPY_CODE
        })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="类型： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Select id="select" size="large" placeholder="请选择类型" {...getFieldProps('MHPY_TYPE',{
            rules: [{ required: true, message: '请选择类型' }],
            initialValue:String(this.state.contentV.MHPY_TYPE)
        })} style={{ width: 163 }}>
          {utypeList}
        </Select>
      </FormItem>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;全名："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}
        help={isFieldValidating('MHPY_FULL_NAME') ? '校验中...' : (getFieldError('MHPY_FULL_NAME') || []).join(', ')}>
      <Input placeholder="请输入全名" {...getFieldProps('MHPY_FULL_NAME',{
          rules: [{ required: true,whitespace:true, message: '请输入全名' },{validator: this.checkMhpyFullName}],
          initialValue:this.state.contentV.MHPY_FULL_NAME
      })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="行业："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
      <Input placeholder="请输入行业" {...getFieldProps('MHPY_INDUSTRY',{
          rules: [{ required: true,whitespace:true, message: '请输入行业' }],
          initialValue:this.state.contentV.MHPY_INDUSTRY
      })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;联系人："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}
        help={isFieldValidating('MHPY_LINKMAN') ? '校验中...' : (getFieldError('MHPY_LINKMAN') || []).join(', ')}>
      <Input placeholder="请输入联系人" {...getFieldProps('MHPY_LINKMAN',{
          rules: [],
          initialValue:this.state.contentV.MHPY_LINKMAN
      })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="电话："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
      <Input placeholder="请输入联系电话" {...getFieldProps('MHPY_PHONE',{
          rules: [],
          initialValue:this.state.contentV.MHPY_PHONE
      })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="移动电话："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
      <Input placeholder="请输入移动电话" {...getFieldProps('MHPY_MOBILE',{
          rules: [],
          initialValue:this.state.contentV.MHPY_MOBILE
      })} style={{ width: 163 }}/>
      </FormItem>
       <div className="ant-modal-footer FormItem-modal-footer">
            <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel} >取消</Button>
            <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleSubmit} loading={this.state.loading}>确定</Button>
        </div>
       </Form>
     )
   }
});
ModalContent = Form.create()(ModalContent);



//表格操作栏
const Edit = React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false
    };
  },
  showModal() {
    this.setState({
      visible: true
    });
  },
  handleCancel() {
    this.setState({
      visible: false
    });
  },
  handleDelete() {
    let DELETE_PARAMS={
      MHPY_ID:this.props.MHPY_ID, //需要删除的ID
      MHPY_FULL_NAME:this.props.MHPY_FULL_NAME //需要删除的名字
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.MHPY_FULL_NAME,
      content: '',
      onOk() {
        //发布 删除 事件
        PubSub.publish("businessandpayerDelete",DELETE_PARAMS);
      },
      onCancel() {}
    });
  },
  render() {
    return (
      <div>
        <a type="primary" onClick={this.showModal} {...this.props}>编辑</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.handleDelete}>删除</a>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={'编辑-'+this.props.MHPY_FULL_NAME}
          onCancel={this.handleCancel}
          footer={null} >
          <ModalContent
            modalClose={this.handleCancel} //传递取消事件
            contentValue={this.props}  //传递表单的值
            visible={this.state.visible}
            />
        </Modal>
      </div>
    );
  }
});


/*新增的弹窗*/
const NewAdd= React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false
    };
  },
  showModal() {
    this.setState({
      visible: true
    });
  },
  handleCancel() {
    this.setState({
      visible: false
    });
  },
  render() {
    return (
      <div>
        <Button type="primary" onClick={this.showModal} className="table-add-btn">添加新商户或支付方<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title="添加新商户或支付方"
          onCancel={this.handleCancel}
          footer={null}>
          <NewAddModalContent
            visible={this.state.visible}
            modalClose={this.handleCancel}
          />
        </Modal>
      </div>
    );
  }
});

//新增添加 弹窗内容
let NewAddModalContent =React.createClass({
  getInitialState() {
    return {
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
    }
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        console.log('表单没通过验证');
        return;
      }
      let params=values;
      //发布 新增 事件
      PubSub.publish("businessandpayerAdd",params);
      this.props.modalClose();
    });
  },
  handleCancel(){
    this.props.modalClose();
  },
  checkMhpyCode(rule, value, callback){
     //  if(!/^[A-Z]([0-9]|[a-zA-Z])$/.test(value)){
     //    setTimeout(() => { callback(new Error('类型编号只能以大写字母开头，且是两个字符组合'))}, 800);
     //    return;
     //  }
      if(!value||!value.trim()){
          callback();
      }else {
        reqwest({
          url:web_config.http_request_domain+'/proc/businessandpayer/checkmhpycode',
          method: 'POST',
          timeout :web_config.http_request_timeout,
          data:{
            MHPY_CODE:value
          },
          crossOrigin:web_config.http_request_cross, //跨域
          type: "json",
          success: (result) => {
            if(result.data.exist==1){
              /*加延时防止闪烁*/
              setTimeout(() => { callback(new Error('编号已存在'))}, 800);
            }else{
              setTimeout(() => {callback()}, 800);
            }
          },
          error:() => {
            setTimeout(() => {callback()}, 800);
            callback(new Error('编号校验失败'));
          }
        });
      }
  },
  checkMhpyFullName(rule, value, callback){
      if(!value||!value.trim()){
          callback();
      }else {
        reqwest({
          url:web_config.http_request_domain+'/proc/businessandpayer/checkmhpyfullname',
          method: 'POST',
          timeout :web_config.http_request_timeout,
          data:{
            MHPY_FULL_NAME:value
          },
          crossOrigin:web_config.http_request_cross, //跨域
          type: "json",
          success: (result) => {
            if(result.data.exist==1){
              /*加延时防止闪烁*/
              setTimeout(() => { callback(new Error('全名已存在'))}, 800);
            }else{
              setTimeout(() => {callback()}, 800);
            }
          },
          error:() => {
            setTimeout(() => {callback()}, 800);
            callback(new Error('全名校验失败'));
          }
        });
      }
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;编号： "
         labelCol={{ span: 8 }}
         wrapperCol={{ span:15 }}
         help={isFieldValidating('MHPY_CODE') ? '校验中...' : (getFieldError('MHPY_CODE') || []).join(', ')}>
         <Input placeholder="请输入编号" {...getFieldProps('MHPY_CODE',{
             rules: [{ required: true,whitespace:true, message: '请输入编号' },{validator: this.checkMhpyCode}]
         })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="类型： "
         labelCol={{ span: 8 }}
         wrapperCol={{ span:15 }}>
         <Select id="select" size="large" placeholder="请选择类型" {...getFieldProps('MHPY_TYPE',{
             rules: [{ required: true, message: '请选择类型' }]
         })} style={{ width: 163 }}>
           {utypeList}
         </Select>
       </FormItem>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;全名："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}
         help={isFieldValidating('MHPY_FULL_NAME') ? '校验中...' : (getFieldError('MHPY_FULL_NAME') || []).join(', ')}>
       <Input placeholder="请输入全名" {...getFieldProps('MHPY_FULL_NAME',{
           rules: [{ required: true,whitespace:true, message: '请输入全名' },{validator: this.checkMhpyFullName}]
       })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="行业："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入行业" {...getFieldProps('MHPY_INDUSTRY',{
           rules: [{ required: true,whitespace:true, message: '请输入行业' }]
       })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;联系人："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}
         help={isFieldValidating('MHPY_LINKMAN') ? '校验中...' : (getFieldError('MHPY_LINKMAN') || []).join(', ')}>
       <Input placeholder="请输入联系人" {...getFieldProps('MHPY_LINKMAN',{
           rules: []
       })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="电话："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入联系电话" {...getFieldProps('MHPY_PHONE',{
           rules: []
       })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="移动电话："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入移动电话" {...getFieldProps('MHPY_MOBILE',{
           rules: []
       })} style={{ width: 163 }}/>
       </FormItem>
        <div className="ant-modal-footer FormItem-modal-footer">
            <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel}>取消</Button>
            <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleSubmit}>确定</Button>
        </div>
       </Form>
     )
   }
});
NewAddModalContent = Form.create()(NewAddModalContent);




//标签分页里面的整个内容
const BusinessAndPayer= React.createClass({
   getInitialState() {
    return {
      data: [],
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1//页数
      },
      loading: false,
      filterClassName:"el-display-none filter-content-layer",//默认隐藏高级搜索
      icontype:'down' //默认高级搜素图标
    };
  },
  handleTableChange(pagination, filters, sorter) {
    const pager = this.state.pagination;
    pager.current = pagination.current;
    this.setState({
      pagination: pager
    });
    const params = {
      type:'tableOnChange',
      pageSize: pagination.pageSize,
      current: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order
    };
    for (let key in filters) {
      if (filters.hasOwnProperty(key)) {
        params[key] = filters[key];
      }
    }
    this.fetchList(params);
  },
  fetchList(params = {}) {
    this.setState({
      filterClassName:"el-display-none filter-content-layer",
      icontype:'down'
    });
    switch (params.type) {
      case undefined:
      case 'undefined':
        params=commonFunction.objExtend(params,this.state.pagination);
        break;
      case 'defaultSearch': //默认搜索行为
        this.state.defaultFilter={
          FILTER_KEY:params.FILTER_KEY
        };
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'moreSearch':    //高级搜索行为
        this.state.moreFilter={
          EMPL_SEX:params.EMPL_SEX
        };
        params=commonFunction.objExtend(params,this.state.defaultFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'tableOnChange'://翻页排序等行为
        this.state.pagination={
          pageSize:params.pageSize,
          current:params.currentPage,
          sortField:params.sortField,
          sortOrder:params.sortOrder
        };
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,this.state.defaultFilter);
        break;
      default:
        params=commonFunction.objExtend(params,this.state.pagination);
    }
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/businessandpayer/list',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:params,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.data.O_T_BUSINESSANDPAYER.count;
        pagination.current = result.data.O_T_BUSINESSANDPAYER.currentPage;
        this.setState({
          loading: false,
          data: result.data.O_T_BUSINESSANDPAYER.data,
          pagination,
        });
      },
      error:()=>{
        commonFunction.MessageTip('获取数据失败',2,'error');
        this.setState({
          loading: false
        });
      }
    });
  },
  fetchEdit(evtName,data){
    let editParams=commonFunction.objExtend({},data);
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/businessandpayer/update',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.MHPY_FULL_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.MHPY_FULL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(params.MHPY_FULL_NAME+'，编辑失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchDelete(evtName,data){
    let deleteParams=commonFunction.objExtend({},data);
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/businessandpayer/delete',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:deleteParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.MHPY_FULL_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.MHPY_FULL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.MHPY_FULL_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=commonFunction.objExtend({},data);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/businessandpayer/add',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:addParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(addParams.MHPY_FULL_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(addParams.MHPY_FULL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList();
      },
      error:()=>{
        commonFunction.MessageTip(addParams.MHPY_FULL_NAME+'，添加失败',2,'error');
        this.fetchList();
      }
    });
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 人员编辑 的事件
    PubSub.subscribe("businessandpayerEdit",this.fetchEdit);
    // 订阅 人员新增 的事件
    PubSub.subscribe("businessandpayerAdd",this.fetchAdd);
    // 订阅 人员删除 的事件
    PubSub.subscribe("businessandpayerDelete",this.fetchDelete);
  },
  //这里还要加个退订事件
  filterDisplay(){
    /*高级搜索展示暂时还没加上动画*/
    if(this.state.filterClassName=="el-display-none filter-content-layer"){
      this.setState({
        filterClassName:"el-display-block filter-content-layer",
        icontype:'up'
      });
    }else{
      this.setState({
        filterClassName:"el-display-none filter-content-layer",
        icontype:'down'
      });
    }
  },
  render() {
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput placeholder="输入名字搜索" onSearch={this.fetchList} /> </Col>
      <Col span="4"><Button type="primary" htmlType="submit" className="gaojibtn" onClick={this.filterDisplay} >高级搜索<Icon type={this.state.icontype} /></Button> </Col>
      <Col span="12" className="table-add-layer"><NewAdd/></Col>
     </Row>
        <div className={this.state.filterClassName} >
          <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
        </div>
        <div className="margin-top-10"></div>
        <Table columns={columns}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
            size="middle"
            rowKey={record => record.MHPY_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default BusinessAndPayer;
