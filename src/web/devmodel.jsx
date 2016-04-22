import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { QueueAnim,DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm,Icon, Button,Dropdown,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import DevPeiZhiCanShu from '../web/devpeizhicanshu.jsx';
import DevPeiZhiMoKuai from '../web/devpeizhimokuai.jsx';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;

//页面名称
const PageName='devmodel';


//定义终端类型
let devtype;


//指定表格每列内容
const columns = [{
  title: '版本',
  dataIndex: 'DVMD_VER'
},{
  title: '终端类型',
  dataIndex: 'DVTP_NAME'
},{
  title: '模块数',
  dataIndex: 'DVMD_MODULE_NUM'
},{
  title: '描述',
  dataIndex: 'DVMD_DESC'
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
    const devtypeList=devtype.map(function(item){
      return (<Option value={String(item.DVTP_ID)} >{item.DVTP_NAME}</Option>)
    });
    return (
      <Form  inline onSubmit={this.handleSubmit} >
        <FormItem
          label="终端类型：">
          <Select placeholder="请选择终端类型" style={{ width: 160 }} {...getFieldProps('FILTER_DVTP_ID')}>
            { devtypeList }
          </Select>
        </FormItem>
        <div style={{ textAlign: 'right' }}>
            <Button size="small" type="primary" htmlType="submit">搜索</Button>
            <Button style={{ marginLeft: '10px' }} size="small" onClick={this.handleReset}>清除条件</Button>
        </div>
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
       let EDIT_PARAMS={
         DVMD_ID:this.state.nochangecontentV.DVMD_ID, //需要的ID
         DVTP_NAME:this.state.nochangecontentV.DVTP_NAME //需要的名字
       };
      let params=commonFunction.objExtend(EDIT_PARAMS,values);
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
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     const devtypeList=devtype.map(function(item){
       return (<Option value={String(item.DVTP_ID)} >{item.DVTP_NAME}</Option>)
     });
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
        <FormItem
          label="终端类型： "
          labelCol={{ span: 8 }}
          wrapperCol={{ span:15 }}>
          <Select id="select" size="large" placeholder="请选择终端类型" {...getFieldProps('DVTP_ID',{
              rules: [{ required: true, message: '请选择终端类别' }],
              initialValue:String(this.state.contentV.DVTP_ID)
          })} style={{ width: 163 }}>
            {devtypeList}
          </Select>
        </FormItem>
        <FormItem
          label="版本："
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 12 }}>
          <Input  {...getFieldProps('DVMD_VER',{
              rules: [{ required: true,message: '请填写版本' },{max: 12, message: '版本至多为 12 个字符'}],
              initialValue:this.state.contentV.DVMD_VER
          })}  style={{ width: 163 }}/>
        </FormItem>
        <FormItem
          label="&nbsp;&nbsp;&nbsp;&nbsp;模块数："
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 12 }}>
        <InputNumber min={0} placeholder="请输入模块数" {...getFieldProps('DVMD_MODULE_NUM',{
            initialValue:this.state.contentV.DVMD_MODULE_NUM || 0
        })} style={{ width: 163 }}/>
        </FormItem>
        <FormItem
          id="control-textarea"
          label="描述："
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 14 }}>
          <Input type="textarea" rows="5" {...getFieldProps('DVMD_DESC',{
              rules: [{max: 124, message: '描述至多为 124 个字符'}],
              initialValue:this.state.contentV.DVMD_DESC
          })}  style={{ width: 620 }}/>
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
  handleCanShu(){
    let DELETE_PARAMS={
      DVMD_ID:this.props.DVMD_ID, //需要的ID
      DVTP_NAME:this.props.DVTP_NAME, //需要的名字
      DVMD_VER:this.props.DVMD_VER
    };
    PubSub.publish(PageName+"PeiZhiCanShu",DELETE_PARAMS);
  },
  handleMoKuai(){
    let DELETE_PARAMS={
      DVMD_ID:this.props.DVMD_ID, //需要的ID
      DVTP_NAME:this.props.DVTP_NAME, //需要的名字
      DVMD_VER:this.props.DVMD_VER
    };
    PubSub.publish(PageName+"PeiZhiMoKuai",DELETE_PARAMS);
  },
  handleDelete() {
    let DELETE_PARAMS={
      DVMD_ID:this.props.DVMD_ID, //需要的ID
      DVTP_NAME:this.props.DVTP_NAME //需要的名字
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.DVTP_NAME,
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
        <a type="primary" onClick={this.showModal} {...this.props}>修改/查看</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.handleDelete}>删除</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.handleCanShu}>配置参数</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.handleMoKuai}>配置模块</a>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={'修改-'+this.props.DVTP_NAME}
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
        <Button type="primary" onClick={this.showModal} className="table-add-btn">添加版本型号<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title="添加版本型号"
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
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     const devtypeList=devtype.map(function(item){
       return (<Option value={String(item.DVTP_ID)} >{item.DVTP_NAME}</Option>)
     });
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <FormItem
         label="终端类型： "
         labelCol={{ span: 8 }}
         wrapperCol={{ span:15 }}>
         <Select id="select" size="large" placeholder="请选择终端类型" {...getFieldProps('DVTP_ID',{
             rules: [{ required: true, message: '请选择终端类别' }]
         })} style={{ width: 163 }}>
           {devtypeList}
         </Select>
       </FormItem>
       <FormItem
         label="版本："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
         <Input  {...getFieldProps('DVMD_VER',{
             rules: [{ required: true,message: '请填写版本' },{max: 12, message: '版本至多为 12 个字符'}]
         })}  style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;模块数："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
       <InputNumber min={0} placeholder="请输入模块数" {...getFieldProps('DVMD_MODULE_NUM',{
           initialValue: 0
       })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         id="control-textarea"
         label="描述："
         labelCol={{ span: 3 }}
         wrapperCol={{ span: 14 }}>
         <Input type="textarea" rows="5" {...getFieldProps('DVMD_DESC',{
             rules: [{max: 124, message: '描述至多为 124 个字符'}]
         })}  style={{ width: 620 }}/>
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
const DevModel= React.createClass({
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
      gaojisousuoVislble:false,
      PeiZhiCanShu:{
        visible:false,
        params:{}
      },
      PeiZhiMoKuai:{
        visible:false,
        params:{}
      }
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
      url:web_config.http_request_domain+'/proc/devmodel/list',
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
        pagination.total = result.data.O_DEVMODEL.count;
        pagination.current = result.data.O_DEVMODEL.currentPage;
        devtype=result.data.O_DEVICE_TYPE;
        this.setState({
          loading: false,
          data: result.data.O_DEVMODEL.data,
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
      url:web_config.http_request_domain+'/proc/devmodel/update',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.DVTP_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.DVTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(params.DVTP_NAME+'，编辑失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/devmodel/delete',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:deleteParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.DVTP_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.DVTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.DVTP_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=commonFunction.objExtend({},data);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/add',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:addParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(addParams.DVTP_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(addParams.DVTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList();
      },
      error:()=>{
        commonFunction.MessageTip(addParams.DVTP_NAME+'，添加失败',2,'error');
        this.fetchList();
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
    // 订阅 配置参数 的事件
    PubSub.subscribe(PageName+"PeiZhiCanShu",this.handlePeiZhiCanShu);
    // 订阅 配置模块 的事件
    PubSub.subscribe(PageName+"PeiZhiMoKuai",this.handlePeiZhiMoKuai);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+"Edit");
    PubSub.unsubscribe(PageName+"Add");
    PubSub.unsubscribe(PageName+"Delete");
    PubSub.unsubscribe(PageName+"PeiZhiMoKuai");
    PubSub.unsubscribe(PageName+"PeiZhiCanShu");
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
  handlePeiZhiCanShu(evtName,data){
    PubSub.unsubscribe(PageName+"Edit");
    PubSub.unsubscribe(PageName+"Add");
    PubSub.unsubscribe(PageName+"Delete");
    PubSub.unsubscribe(PageName+"PeiZhiMoKuai");
    PubSub.unsubscribe(PageName+"PeiZhiCanShu");
    this.setState({
      PeiZhiCanShu:{
        visible:true,
        params:data
      }
    });
  },
  handlePeiZhiMoKuai(evtName,data){
    PubSub.unsubscribe(PageName+"Edit");
    PubSub.unsubscribe(PageName+"Add");
    PubSub.unsubscribe(PageName+"Delete");
    PubSub.unsubscribe(PageName+"PeiZhiMoKuai");
    PubSub.unsubscribe(PageName+"PeiZhiCanShu");
    this.setState({
      PeiZhiMoKuai:{
        visible:true,
        params:data
      }
    });
  },
  render() {
    if(this.state.PeiZhiCanShu.visible==true){
      return (<DevPeiZhiCanShu {...this.state.PeiZhiCanShu.params}/>)
    }
    if(this.state.PeiZhiMoKuai.visible==true){
      return (<DevPeiZhiMoKuai {...this.state.PeiZhiMoKuai.params}/>)
    }
    const FilterLayerContent= (
      <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput placeholder="输入版本搜索" onSearch={this.fetchList} /> </Col>
      <Col span="2" style={{marginLeft:-10}}>
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
            rowKey={record => record.DVMD_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
    </div>
    );
  }
});



export default DevModel;
