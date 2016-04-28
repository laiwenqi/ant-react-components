import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { Transfer,DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm,Icon, Button,Dropdown,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;

//页面名称
const PageName='role';

//权限
let rolePower;

//指定表格每列内容
const columns = [
 //  {
 //  title: '角色序号',
 //  dataIndex: 'ROLE_ID'
 // },
{
  title: '角色名称',
  dataIndex: 'ROLE_NAME'
},{
  title: '角色描述',
  dataIndex: 'ROLE_INFO'
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
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe(PageName+"Reset",this.handleReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+'Reset');
  },
  handleReset(){
    this.setState({
      FILTER_KEY:''
    });
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
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe(PageName+"Reset",this.handleButtonReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+'Reset');
  },
  handleButtonReset() {
    this.props.form.resetFields();
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
      <Form  inline onSubmit={this.handleSubmit} >

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
      let params=commonFunction.objExtend({ROLE_ID:this.state.nochangecontentV.ROLE_ID},values);
      //发布 编辑 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish(PageName+"Edit",params);
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
 checkRoleName(rule, value, callback){
   //对比，如果和原来的值一样就不做校验了
   if(this.state.nochangecontentV.ROLE_NAME==value){
     callback();
     return;
   }
   if( value.trim() ==''){
       callback();
   }else {
     reqwest({
       url:web_config.http_request_domain+'/proc/role/checkrolename',
       method: 'POST',
       timeout :web_config.http_request_timeout,
       data:{
         ROLE_NAME:value.trim()
       },
       crossOrigin:web_config.http_request_cross, //跨域
       type: "json",
       success: (result) => {
         if(result.data.exist==1){
           /*加延时防止闪烁*/
           setTimeout(() => { callback(new Error('角色名称已存在'))}, 800);
         }else{
           setTimeout(() => {callback()}, 800);
         }
       },
       error:() => {
         setTimeout(() => {callback()}, 800);
         callback(new Error('角色名称校验失败'));
       }
     });
   }
 },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form horizontal form={this.props.form}>
      <FormItem
        label="角色名称："
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 12 }}
        help={isFieldValidating('ROLE_NAME') ? '校验中...' : (getFieldError('ROLE_NAME') || []).join(', ')}>
      <Input placeholder="请输入角色名称" {...getFieldProps('ROLE_NAME',{
          rules: [{ max: 64, message: '角色名称至多为 64 个字符' },{ required: true,whitespace:true, message: '请输入角色名称' },{validator: this.checkRoleName}],
          initialValue:this.state.contentV.ROLE_NAME
      })} style={{ width: 303 }}/>
      </FormItem>
      <FormItem
        id="control-textarea"
        label="角色描述："
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}>
        <Input type="textarea" rows="5" {...getFieldProps('ROLE_INFO',{
            rules: [{max: 128, message: '角色描述至多为 128 个字符'}],
            initialValue:this.state.contentV.ROLE_INFO
        })}   style={{ width: 620 }}/>
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



//点击权限编辑 弹窗内容
let PowerModalContent =React.createClass({
  getInitialState() {
    return {
      loading:false,//确定按钮状态
      nochangecontentV:this.props.contentValue,//这个用来对比是不是和原来的值一样，暂时用这个办法
      contentV:this.props.contentValue,
      targetKeys:this.props.contentValue.power,
      mockData:rolePower
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
      //  let aProps = this.state.targetKeys;
      //  let bProps = this.state.nochangecontentV.power;
      //  let hasChanged=0; /*0表示没有改变*/
       //
      //  for (let i = 0; i < aProps.length; i++) {
       //
      //  }
      //  if(hasChanged==0){
      //    this.handleCancel();
      //    return;
      //  }

      let params=commonFunction.objExtend({ROLE_NAME:this.state.nochangecontentV.ROLE_NAME,ROLE_ID:this.state.nochangecontentV.ROLE_ID,POWER_LIST:JSON.stringify(this.state.targetKeys)},values);
      //发布 权限配置 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish(PageName+"PowerEdit",params);
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
 handleChange(targetKeys, direction, moveKeys) {
    this.setState({ targetKeys });
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form horizontal form={this.props.form}>
        <FormItem style={{marginLeft:80}}>
          <Transfer
            titles={['禁用权限','可用权限']}
            dataSource={this.state.mockData}
            targetKeys={this.state.targetKeys}
            notFoundContent="暂无"
            render={item => item.title}
            listStyle={{
                width: 250,
                height: 300,
            }}
            {...getFieldProps('ROLE_POWER',{
              onChange:this.handleChange
            })}/>
        </FormItem>
       <div className="ant-modal-footer FormItem-modal-footer">
            <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel} >取消</Button>
            <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleSubmit} loading={this.state.loading}>确定</Button>
        </div>
       </Form>
     )
   }
});
PowerModalContent = Form.create()(PowerModalContent);


//表格操作栏
const Edit = React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false,
      pvisible: false
    };
  },
  showPowerModal() {
    this.setState({
      pvisible: true
    });
  },
  handlePowerCancel() {
    this.setState({
      pvisible: false
    });
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
      ROLE_ID:this.props.ROLE_ID, //需要删除的人员ID
      ROLE_NAME:this.props.ROLE_NAME //需要删除的人员名字
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.ROLE_NAME,
      content: '',
      onOk() {
        //发布 删除 事件
        PubSub.publish(PageName+"Delete",DELETE_PARAMS);
      },
      onCancel() {}
    });
  },
  render() {
    return (
      <div>
        <a type="primary" onClick={this.showPowerModal} {...this.props}>配置权限</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.showModal} {...this.props}>修改</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.handleDelete}>删除</a>
        <Modal ref="modal"
          width="700"
          visible={this.state.pvisible}
          title={'配置权限-'+this.props.ROLE_NAME}
          onCancel={this.handlePowerCancel}
          footer={null} >
          <PowerModalContent
            modalClose={this.handlePowerCancel} //传递取消事件
            contentValue={this.props}  //传递表单的值
            visible={this.state.pvisible}
            />
        </Modal>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={'修改-'+this.props.ROLE_NAME}
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
        <Button type="primary" onClick={this.showModal} className="table-add-btn">添加角色<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title="添加角色"
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
      PubSub.publish(PageName+"Add",params);
      this.props.modalClose();
    });
  },
  handleCancel(){
    this.props.modalClose();
  },
  checkRoleName(rule, value, callback){
    if( value.trim() ==''){
        callback();
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/role/checkrolename',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          ROLE_NAME:value.trim()
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('角色名称已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback()}, 800);
          callback(new Error('角色名称校验失败'));
        }
      });
    }
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form horizontal form={this.props.form}>
       <FormItem
         label="角色名称："
         labelCol={{ span: 6 }}
         wrapperCol={{ span: 12 }}
         help={isFieldValidating('ROLE_NAME') ? '校验中...' : (getFieldError('ROLE_NAME') || []).join(', ')}>
       <Input placeholder="请输入角色名称" {...getFieldProps('ROLE_NAME',{
           rules: [{ max: 64, message: '角色名称至多为 64 个字符' },{ required: true,whitespace:true, message: '请输入角色名称' },{validator: this.checkRoleName}]
       })} style={{ width: 303 }}/>
       </FormItem>
       <FormItem
         id="control-textarea"
         label="角色描述："
         labelCol={{ span: 6 }}
         wrapperCol={{ span: 14 }}>
         <Input type="textarea" rows="5" {...getFieldProps('ROLE_INFO',{
             rules: [{max: 128, message: '角色描述至多为 128 个字符'}]
         })}   style={{ width: 620 }}/>
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
const Role= React.createClass({
   getInitialState() {
    return {
      data: [],
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1,//页数
        size:'large',
        showTotal:function showTotal(total) {
            return `共 ${total} 条记录`;
        },
        showQuickJumper:true,
        // showSizeChanger :true
      },
      loading: false,
      gaojisousuoVislble:false
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
    switch (params.type) {
      case undefined:
      case 'undefined':
        params=commonFunction.objExtend(params,this.state.pagination);
        break;
      case 'defaultSearch': //默认搜索行为
        this.state.defaultFilter=commonFunction.filterParamsObj(params);
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'moreSearch':    //高级搜索行为
        this.state.moreFilter=commonFunction.filterParamsObj(params);
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
      url:web_config.http_request_domain+'/proc/role/list',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:params,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          this.setState({
            loading: false
          });
          return;
        }
        const pagination = this.state.pagination;
        pagination.total = result.data.O_ROLE.count;
        pagination.current = result.data.O_ROLE.currentPage;
        rolePower=result.data.O_ROLE_POWER;
        this.setState({
          loading: false,
          data: result.data.O_ROLE.data,
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
      url:web_config.http_request_domain+'/proc/role/update',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.ROLE_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.ROLE_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(editParams.ROLE_NAME+'，编辑失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/role/destroy',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:deleteParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.ROLE_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.ROLE_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.ROLE_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=commonFunction.objExtend({},data);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/role/add',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:addParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(addParams.ROLE_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(addParams.ROLE_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList();
      },
      error:()=>{
        commonFunction.MessageTip(addParams.ROLE_NAME+'，添加失败',2,'error');
        this.fetchList();
      }
    });
  },
  fetchPowerEdit(evtName,data){
    let editParams=commonFunction.objExtend({},data);
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/role/powerupdate',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.ROLE_NAME+'，配置权限成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.ROLE_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(editParams.ROLE_NAME+'，配置权限失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 编辑 的事件
    PubSub.subscribe(PageName+"Edit",this.fetchEdit);
    // 订阅 新增 的事件
    PubSub.subscribe(PageName+"Add",this.fetchAdd);
    // 订阅 删除 的事件
    PubSub.subscribe(PageName+"Delete",this.fetchDelete);
    // 订阅 配置权限 的事件
    PubSub.subscribe(PageName+"PowerEdit",this.fetchPowerEdit);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+"Edit");
    PubSub.unsubscribe(PageName+"Add");
    PubSub.unsubscribe(PageName+"Delete");
    PubSub.unsubscribe(PageName+"PowerEdit");
  },
  filterDisplay(){
    this.setState({
      gaojisousuoVislble:!this.state.gaojisousuoVislble
    });
  },
  fliterDisplayChange(e){
    this.setState({
      gaojisousuoVislble:e
    });
  },
  resetSearch(){
    this.setState({
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1,//页数
        size:'large',
        showTotal:function showTotal(total) {
            return `共 ${total} 条记录`;
        },
        showQuickJumper:true
      }
    });
    PubSub.publish(PageName+"Reset",{});
    this.fetchList({
      type:'reset',
      pageSize:10,
      current:1
    });
  },
  render() {
    const FilterLayerContent= (
      <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput placeholder="输入角色名称搜索" onSearch={this.fetchList} /> </Col>
      <Col span="2" className="el-display-none" style={{marginLeft:-10}}>
        <Popover placement="bottom" visible={this.state.gaojisousuoVislble} onVisibleChange={this.fliterDisplayChange} overlay={FilterLayerContent} trigger="click">
            <Button type="primary" htmlType="submit" className="gaojibtn" >高级搜索</Button>
        </Popover>
      </Col>
      <Col span="1" style={{marginLeft:-20}}>
        <Button type="primary" htmlType="submit" onClick={this.resetSearch} >重置</Button>
      </Col>
          <Col span="12" className="table-add-layer"><NewAdd/></Col>
     </Row>
        <div className="margin-top-10"></div>
        <Table columns={columns}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
            size="middle"
            rowKey={record => record.ROLE_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default Role;
