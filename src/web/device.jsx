import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { Steps,Badge,DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm, message,Icon, Button,Dropdown,Menu,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import '../function/function.js';
import './device.less';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;
const Step = Steps.Step;

//指定表格每列内容
const columns = [{
  title: '终端名',
  dataIndex: 'DEV_NAME'
},{
  title: '序列号',
  dataIndex: 'DEV_SN'
  /* sorter: true */
},{
  title: '状态',
  dataIndex: 'DEV_USE_STATE',
  render(text, row, index) {
    switch (row.DEV_USE_STATE) {
      case 1:
        return (
          <div ><Badge dot style={{ backgroundColor: '#87d068' }}/><span className="status-word">可用</span></div>
        );
        break;
      case 0:
        return (
          <div ><Badge dot style={{ backgroundColor: '#FFA500' }}/><span className="status-word">暂停使用</span></div>
        );
        break;
      case 3:
        return (
          <div ><Badge dot style={{ backgroundColor: '#red' }}/><span className="status-word">已报废</span></div>
        );
        break;
      default:
    }
  }
},{
  title: '归属组织',
  dataIndex: 'ORG_NAME'
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


//对象合并
const objExtend=function(o,n){

  for(let tem in n){
    if(tem=='type'){
      continue;
    } //不要把 type 覆盖掉
    o[tem]=n[tem];
  }
  return o;
};



//全局提示框
const MessageTip=function(msg,time,type) {
  time=time||2;
  type=type||'success';
  switch(type){
    case 'success':
      message.success(msg,time);
    break;
    case 'error':
      message.error(msg,time);
    break;
    case 'info':
      message.info(msg,time);
    break;
    case 'loading':
      message.loading(msg,time);
    break;
  }
};






//这里是默认简易的搜索
let SearchInput = React.createClass({
  getInitialState() {
    return {
      DEV_KEY: '',
      focus: false,
    };
  },
  handleInputChange(e) {
    this.setState({
      DEV_KEY: e.target.value,
    });
  },
  handleFocusBlur(e) {
    this.setState({
      focus: e.target === document.activeElement,
    });
  },
  handleSearch(e) {
    let params={};
    params.DEV_KEY=this.state.DEV_KEY.trim();
    params.type="defaultSearch";
    if (this.props.onSearch) {
      this.props.onSearch(params);
    }
  },
  render() {
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.DEV_KEY.trim(),
    });
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    });
    return (
      <InputGroup className={searchCls} style={this.props.style}>
        <Input {...this.props} value={this.state.DEV_KEY} onChange={this.handleInputChange}
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
          <Select placeholder="请选择性别" style={{ width: 120 }} {...getFieldProps('DEV_SEX')}>
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
      stepCurrent:0,//步骤条已完成的步骤数
      sureButtonWord:'下一步',
      lastStepButtonVisible:"el-display-none",
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
  handleNext(){
    //完成了
    if(this.state.stepCurrent>=4){
      return;
    }
    if(this.state.stepCurrent==3){
      this.setState({
        stepCurrent:this.state.stepCurrent+1,
        sureButtonWord:"保存",
        lastStepButtonVisible:""
      });
      return;
    }
    this.setState({
      stepCurrent:this.state.stepCurrent+1,
      lastStepButtonVisible:""
    });
  },
  handleBack(){
    if(this.state.stepCurrent==1){
      this.setState({
        stepCurrent:this.state.stepCurrent-1,
        sureButtonWord:"下一步",
        lastStepButtonVisible:"el-display-none"
      });
      return;
    }
    this.setState({
      stepCurrent:this.state.stepCurrent-1,
      sureButtonWord:"下一步"
    });
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        console.log('Errors in form!!!');
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
      let params=objExtend({DEV_ID:this.state.nochangecontentV.DEV_ID},values);
      //发布 编辑 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish("devEdit",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  checkOther(rule, value, callback){
    callback();
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
     return (
       <div>
       <Steps current={this.state.stepCurrent}>
        <Step title="基本信息" />
        <Step title="参数"  />
        <Step title="模块"  />
        <Step title="文件"  />
        <Step title="服务"  />
      </Steps>
      <br/>
       <Form inline form={this.props.form}>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;终端名："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入终端名"  defaultValue={this.state.contentV.DEV_NAME} style={{ width: 163 }} />
        </FormItem>
        <FormItem
          label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;序列号："
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 12 }}>
         <Input placeholder="请输入序列号"  defaultValue={this.state.contentV.DEV_SN} style={{ width: 163 }} />
         </FormItem>
         <FormItem
           label="归属组织： "
           labelCol={{ span: 8 }}
           wrapperCol={{ span:15 }}>
           <Select id="select" size="large" placeholder="请选择归属组织" {...getFieldProps('ORG_ID',{
               rules: [{ required: true, message: '请选择组织' },{validator: this.checkOther}],
               initialValue:String(this.state.contentV.ORG_ID)
           })} style={{ width: 163 }}>
             <Option value="1" >公交卡运营公司</Option>
             <Option value="2" >南屏公交公司</Option>
           </Select>
         </FormItem>
         <FormItem
           label="归属系统： "
           labelCol={{ span: 8 }}
           wrapperCol={{ span:15 }}>
           <Select id="select" size="large" placeholder="请选择归属系统" {...getFieldProps('DEV_PARENT_ID',{
               rules: [{ required: true, message: '请选择系统' },{validator: this.checkOther}],
               initialValue:String(this.state.contentV.DEV_PARENT_ID)
           })} style={{ width: 163 }}>
             <Option value="1" >服务终端在线管理系统</Option>
           </Select>
         </FormItem>
        <div className="ant-modal-footer FormItem-modal-footer">
            <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel} >取消</Button>
            <Button type="primary" className={"ant-btn ant-btn-primary ant-btn-lg "+this.state.lastStepButtonVisible}   onClick={this.handleBack} >上一步</Button>
            <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleNext} loading={this.state.loading}>{this.state.sureButtonWord}</Button>
        </div>
       </Form>
       </div>
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
      DEV_ID:this.props.DEV_ID, //需要删除的ID
      DEV_NAME:this.props.DEV_NAME //需要删除的名字
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.DEV_NAME,
      content: '',
      onOk() {
        //发布 删除 事件
        PubSub.publish("devDelete",DELETE_PARAMS);
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
          width="600"
          visible={this.state.visible}
          title={'编辑终端-'+this.props.DEV_NAME}
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
        <Button type="primary" onClick={this.showModal} className="employee-add-btn">添加终端<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          visible={this.state.visible}
          title="添加终端"
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
        console.log('Errors in form!!!');
        return;
      }
      let params=values;
      //发布 新增 事件
      PubSub.publish("devAdd",params);
      this.props.modalClose();
    });
  },
  handleCancel(){
    this.props.modalClose();
  },
  checkOther(rule, value, callback){
    callback();
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;用户名："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}
        //  hasFeedback
         help={isFieldValidating('DEV_NAME') ? '校验中...' : (getFieldError('DEV_NAME') || []).join(', ')}>
        <Input placeholder="请输入终端名"  {...getFieldProps('DEV_NAME',{
            rules: [{ required: true,whitespace:true,message: '请输入终端名' },{validator: this.checkOperAccount}]
        })} style={{ width: 163 }} />
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
const Device= React.createClass({
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
      filterClassName:"filter-content-hidden filter-content-layer",//默认隐藏高级搜索
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
      filterClassName:"filter-content-hidden filter-content-layer",
      icontype:'down'
    });
    switch (params.type) {
      case undefined:
      case 'undefined':
        params=objExtend(params,this.state.pagination);
        break;
      case 'defaultSearch': //默认搜索行为
        this.state.defaultFilter={
          DEV_KEY:params.DEV_KEY
        };
        params=objExtend(params,this.state.moreFilter);
        params=objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'moreSearch':    //高级搜索行为
        this.state.moreFilter={
          DEV_SEX:params.DEV_SEX
        };
        params=objExtend(params,this.state.defaultFilter);
        params=objExtend(params,{
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
        params=objExtend(params,this.state.moreFilter);
        params=objExtend(params,this.state.defaultFilter);
        break;
      default:
        params=objExtend(params,this.state.pagination);
    }
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/device/devlist',
      method: 'POST',
      data:params,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.data.O_DEVICE.count;
        pagination.current = result.data.O_DEVICE.currentPage;
        this.setState({
          loading: false,
          data: result.data.O_DEVICE.data,
          pagination,
        });
      }
    });
  },
  fetchEdit(evtName,data){
    let editParams=objExtend({},data);
    let listParams=objExtend({},this.state.defaultFilter);
    listParams=objExtend(listParams,this.state.moreFilter);
    listParams=objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/device/update',
      method: 'POST',
      data:editParams,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&MessageTip(editParams.DEV_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&MessageTip(editParams.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        MessageTip(params.DEV_NAME+'，编辑失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchDelete(evtName,data){
    let deleteParams=objExtend({},data);
    let listParams=objExtend({},this.state.defaultFilter);
    listParams=objExtend(listParams,this.state.moreFilter);
    listParams=objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/device/delete',
      method: 'POST',
      data:deleteParams,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && MessageTip(deleteParams.DEV_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && MessageTip(deleteParams.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        MessageTip(deleteParams.DEV_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=objExtend({},data);
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/device/add',
      method: 'POST',
      data:addParams,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && MessageTip(addParams.DEV_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && MessageTip(addParams.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList();
      },
      error:()=>{
        MessageTip(addParams.DEV_NAME+'，添加失败',2,'error');
        this.fetchList();
      }
    });
  },
  fetchResetPassword(evtName,data){
    let listParams=objExtend({},this.state.defaultFilter);
    listParams=objExtend(listParams,this.state.moreFilter);
    listParams=objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/dev/resetpassword',
      method: 'POST',
      data:data,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && MessageTip(data.DEV_NAME+'，重置密码成功',2,'success');
        result.data.ERROR!=0 && MessageTip(data.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        MessageTip(data.DEV_NAME+'，重置密码失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 编辑 的事件
    PubSub.subscribe("devEdit",this.fetchEdit);
    // 订阅 新增 的事件
    PubSub.subscribe("devAdd",this.fetchAdd);
    // 订阅 删除 的事件
    PubSub.subscribe("devDelete",this.fetchDelete);
  },
  //这里还要加个退订事件
  filterDisplay(){
    /*高级搜索展示暂时还没加上动画*/
    if(this.state.filterClassName=="filter-content-hidden filter-content-layer"){
      this.setState({
        filterClassName:"filter-content-show filter-content-layer",
        icontype:'up'
      });
    }else{
      this.setState({
        filterClassName:"filter-content-hidden filter-content-layer",
        icontype:'down'
      });
    }
  },
  render() {
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput placeholder="输入搜索" onSearch={this.fetchList} /> </Col>
      <Col span="4"><Button type="primary" htmlType="submit" className="gaojibtn" onClick={this.filterDisplay} >高级搜索<Icon type={this.state.icontype} /></Button> </Col>
      <Col span="12" className="employee-add-layer"><NewAdd/></Col>
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
            rowKey={record => record.ID} /*指定每行的主键 不指定默认key*/
            bordered='true'
        />
   </div>
    );
  }
});



export default Device;
