import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { DatePicker,Row,Col,Form,Checkbox,Table,Modal,Input,Popconfirm,Icon,Button,Dropdown,Popover,Select } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import './employee.less';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;

//定义组织
let organization;

//定义角色
let role;

//指定表格每列内容
const columns = [{
  title: '用户名',
  dataIndex: 'OPER_ACCOUNT',
  sorter: true
},{
  title: '姓名',
  dataIndex: 'EMPL_NAME',
  sorter: true
},{
  title: '联系电话',
  dataIndex: 'EMPL_MOBILE',
  render(text, row, index) {
    return row.EMPL_MOBILE==''?'暂无':row.EMPL_MOBILE;
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
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe("employeeReset",this.handleReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe('employeeReset');
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
    PubSub.subscribe("employeeReset",this.handleButtonReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe("employeeReset");
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
    const organizationList=organization.map(function(item){
      return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
    });
    const roleList=role.map(function(item){
      return (<Option value={String(item.ROLE_ID)} >{item.ROLE_NAME}</Option>)
    });
    return (
      <div>
        <Form inline  onSubmit={this.handleSubmit} >
          <FormItem
            label="选择性别：">
            <Select placeholder="请选择性别" style={{ width: 120 }} {...getFieldProps('FILTER_EMPL_SEX')}>
              <Option value="0">女</Option>
              <Option value="1">男</Option>
            </Select>
          </FormItem>
          <br/>
          <FormItem
            label="选择组织：">
            <Select placeholder="请选择组织" style={{ width: 120 }} {...getFieldProps('FILTER_ORG_ID')}>
              { organizationList }
            </Select>
          </FormItem>
          <br/>
          <FormItem
            label="选择角色：">
            <Select placeholder="请选择角色" style={{ width: 120 }} {...getFieldProps('FILTER_ROLE_ID')}>
              { roleList }
            </Select>
          </FormItem>
          <br/>
          <div style={{ textAlign: 'right' }}>
              <Button size="small" type="primary" htmlType="submit">搜索</Button>
              <Button style={{ marginLeft: '10px' }} size="small" onClick={this.handleReset}>清除条件</Button>
          </div>
        </Form>
        </div>
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
        console.log('表单没通过验证!!!');
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
      let params=commonFunction.objExtend({EMPL_ID:this.state.nochangecontentV.EMPL_ID},values);
      if(params.EMPL_BIRTHDAY!=null){
        params.EMPL_BIRTHDAY=commonFunction.formatTime(params.EMPL_BIRTHDAY,'yyyy-MM-dd');
      }else{
        params.EMPL_BIRTHDAY='';
      }
      this.state.loading=true;
      this.props.modalClose();
      //发布 编辑 事件
      PubSub.publish("Edit",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  checkEmplName(rule, value, callback){
    //对比，如果和原来的值一样就不做校验了
    if(this.state.nochangecontentV.EMPL_NAME==value){
      callback();
      return;
    }
    if( !value||!value.trim()){
        callback();
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplname',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          EMPL_NAME:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('人员姓名已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback()}, 800);
          callback(new Error('人员姓名校验失败'));
        }
      });
    }
  },
  checkEmplCode(rule, value, callback){
    //对比，如果和原来的值一样就不做校验了
    if(this.state.nochangecontentV.EMPL_CODE==value){
      callback();
      return;
    }
    if( !value||!value.trim()){
        callback();
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplcode',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          EMPL_CODE:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('人员工号已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback()}, 800);
          callback(new Error('人员工号校验失败'));
        }
      });
    }
  },
  checkEmplCardCode(rule, value, callback){
    //对比，如果和原来的值一样就不做校验了
    if(value !=''&&this.state.nochangecontentV.EMPL_CARD_CODE==value){
      callback();
      return;
    }
    if( !value||!value.trim()){
      const { getFieldValue } = this.props.form;
      if(getFieldValue('OPER_TERM_IF_AUTH')==1){
        callback(new Error('终端授权时，不能空'));
      }else{
        callback();
      };
      return;
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplcardcode',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          EMPL_CARD_CODE:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('身份卡号已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback(new Error('身份卡号校验失败'))}, 800);
        }
      });
    }
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
     const organizationList=organization.map(function(item){
       return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
     });
     const roleList=role.map(function(item){
       return (<Option value={String(item.ROLE_ID)} >{item.ROLE_NAME}</Option>)
     });
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;用户名："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入用户名" disabled='true' defaultValue={this.state.contentV.OPER_ACCOUNT} style={{ width: 163 }} />
        </FormItem>
        <FormItem
          label="人员姓名："
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 12 }}
          help={isFieldValidating('EMPL_NAME') ? '校验中...' : (getFieldError('EMPL_NAME') || []).join(', ')}>
        <Input placeholder="请输入姓名" {...getFieldProps('EMPL_NAME',{
            rules: [{ max: 24, message: '人员姓名至多为 24 个字符' },{ required: true,whitespace:true, message: '请输入姓名' },{validator: this.checkEmplName}],
            initialValue:this.state.contentV.EMPL_NAME
        })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="人员工号："
         labelCol={{ span: 8}}
         wrapperCol={{ span: 12 }}
         help={isFieldValidating('EMPL_CODE') ? '校验中...' : (getFieldError('EMPL_CODE') || []).join(', ')}>
       <Input placeholder="请输入人员工号" {...getFieldProps('EMPL_CODE',{
           rules: [{ max: 24, message: '人员工号至多为 24 个字符' },{ required: true,whitespace:true, message: '请输入工号' },{validator: this.checkEmplCode}],
           initialValue:this.state.contentV.EMPL_CODE
       })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;身份卡号： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}
        help={isFieldValidating('EMPL_CARD_CODE') ? '校验中...' : (getFieldError('EMPL_CARD_CODE') || []).join(', ')}>
        <Input placeholder="请输入身份卡号" {...getFieldProps('EMPL_CARD_CODE',{
            rules: [{ max: 24, message: '身份卡号至多为 24 个字符' },{validator: this.checkEmplCardCode}],
            initialValue:this.state.contentV.EMPL_CARD_CODE
        })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="归属组织： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Select id="select" size="large" placeholder="请选择归属组织" {...getFieldProps('ORG_ID',{
            rules: [{ required: true, message: '请选择组织' },{validator: this.checkOther}],
            initialValue:String(this.state.contentV.ORG_ID)
        })} style={{ width: 163 }}>
          { organizationList }
        </Select>
      </FormItem>
      <FormItem
        label="角色分配："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
        <Select id="select" size="large" placeholder="请选择角色" {...getFieldProps('ROLE_ID',{
            rules: [{ required: true,message: '请选择角色' },{validator: this.checkOther}],
            initialValue:String(this.state.contentV.ROLE_ID)
        })} style={{ width: 163 }}>
          { roleList }
        </Select>
     </FormItem>
     <FormItem
       label="终端授权： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:15 }}>
       <Select id="select" size="large" placeholder="请选择是否授权" {...getFieldProps('OPER_TERM_IF_AUTH',{
           rules: [{ required: true,message: '请选择是否授权' },{validator: this.checkOther}],
           initialValue:String(this.state.contentV.OPER_TERM_IF_AUTH)
       })} style={{ width: 163 }}>
         <Option value="0">否</Option>
         <Option value="1">是</Option>
       </Select>
     </FormItem>
     <FormItem
       label="员工性别： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:12 }}>
       <Select id="select" size="large" placeholder="请选择性别"  {...getFieldProps('EMPL_SEX',{
           rules: [{ required: true,message: '请选择是否性别' },{validator: this.checkOther}],
           initialValue:String(this.state.contentV.EMPL_SEX)
       })} style={{ width: 163 }}>
         <Option value="1">男</Option>
         <Option value="0">女</Option>
       </Select>
     </FormItem>
     <FormItem
       label="&nbsp;&nbsp;&nbsp;&nbsp;出生日期： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:12 }}>
       <DatePicker {...getFieldProps('EMPL_BIRTHDAY',{
           initialValue:this.state.contentV.EMPL_BIRTHDAY
       })} style={{ width: 163 }} />
     </FormItem>
     <FormItem
       label="&nbsp;&nbsp;&nbsp;电子邮箱："
       labelCol={{ span: 8}}
       wrapperCol={{ span: 12 }}>
     <Input placeholder="请输入电子邮箱" {...getFieldProps('EMPL_EMAIL',{
         rules: [{ max: 124, message: '电子邮箱至多为 124 个字符' },{ type: 'email', message: '请输入正确的邮箱' },{validator: this.checkOther}],
         validateTrigger:'onBlur',
         initialValue:this.state.contentV.EMPL_EMAIL
     })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;手机号码："
        labelCol={{ span: 8}}
        wrapperCol={{ span: 12 }}>
      <Input placeholder="请输入手机号码" {...getFieldProps('EMPL_MOBILE',{
          rules: [{ pattern: /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/, message: '请输入正确的手机号码' }],
          validateTrigger:'onBlur',
          initialValue:this.state.contentV.EMPL_MOBILE
      })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;办公电话："
         labelCol={{ span: 8}}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入办公电话" {...getFieldProps('EMPL_OFFICE_PHONE',{
           rules: [{ pattern: /^(^0\\d{2}-?\\d{8}$)|(^0\\d{3}-?\\d{7}$)|(^\\(0\\d{2}\\)-?\\d{8}$)|(^\\(0\\d{3}\\)-?\\d{7}$)$/, message: '请输入正确的办公电话' }],
           validateTrigger:'onBlur',
           initialValue:this.state.contentV.EMPL_OFFICE_PHONE
       })} style={{ width: 163 }}/>
        </FormItem>
        <FormItem
          label="住址："
          labelCol={{ span:4}}
          wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入住址" {...getFieldProps('EMPL_ADDRESS',{
            rules: [{ max: 124, message: '住址至多为 124 个字符' }],
            initialValue:this.state.contentV.EMPL_ADDRESS
        })} style={{ width: 405 }} />
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
      EMPL_ID:this.props.EMPL_ID, //需要删除的人员ID
      EMPL_NAME:this.props.EMPL_NAME //需要删除的人员名字
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.EMPL_NAME,
      content: '',
      onOk() {
        //发布 删除 事件
        PubSub.publish("Delete",DELETE_PARAMS);
      },
      onCancel() {}
    });
  },
  handleReset() {
    let RESET_PARAMS={
      EMPL_ID:this.props.EMPL_ID, //需要删除的人员ID
      EMPL_NAME:this.props.EMPL_NAME //需要删除的人员名字
    };
    confirm({
      title: '您是否确认要重置'+RESET_PARAMS.EMPL_NAME+'的密码',
      content: '',
      onOk() {
        //发布 重置密码 事件
        PubSub.publish("ResetPassword",RESET_PARAMS);
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
        <a type="primary" onClick={this.handleReset}>重置密码</a>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={'修改信息-'+this.props.EMPL_NAME}
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
        <Button type="primary" onClick={this.showModal} className="table-add-btn">添加人员<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title="添加人员"
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
        console.log('表单未通过验证!!!');
        return;
      }
      let params=values;
      //发布 新增 事件
      if(params.EMPL_BIRTHDAY!=null){
        params.EMPL_BIRTHDAY=commonFunction.formatTime(params.EMPL_BIRTHDAY,'yyyy-MM-dd');
      }else{
        params.EMPL_BIRTHDAY='';
      }
      PubSub.publish("Add",params);
      this.props.modalClose();
    });
  },
  handleCancel(){
    this.props.modalClose();
  },
  checkOperAccount(rule, value, callback){
    if(!value||!value.trim()){
        callback();
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplaccount',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          OPER_ACCOUNT:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('用户名已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback()}, 800);
          callback(new Error('用户名校验失败'));
        }
      });
    }
  },
  checkEmplName(rule, value, callback){
    if(!value||!value.trim()){
        callback();
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplname',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          EMPL_NAME:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('人员姓名已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback()}, 800);
          callback(new Error('人员姓名校验失败'));
        }
      });
    }
  },
  checkEmplCode(rule, value, callback){
    if(!value||!value.trim()){
        callback();
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplcode',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          EMPL_CODE:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('人员工号已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback()}, 800);
          callback(new Error('人员工号校验失败'));
        }
      });
    }
  },
  checkEmplCardCode(rule, value, callback){
    if(!value||!value.trim()){
      const { getFieldValue } = this.props.form;
      if(getFieldValue('OPER_TERM_IF_AUTH')==1){
        callback(new Error('终端授权时，不能空'));
      }else{
        callback();
      };
      return;
    }else {
      reqwest({
        url:web_config.http_request_domain+'/proc/employee/checkemplcardcode',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{
          EMPL_CARD_CODE:value
        },
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
          if(result.data.exist==1){
            /*加延时防止闪烁*/
            setTimeout(() => { callback(new Error('身份卡号已存在'))}, 800);
          }else{
            setTimeout(() => {callback()}, 800);
          }
        },
        error:() => {
          setTimeout(() => {callback(new Error('身份卡号校验失败'))}, 800);
        }
      });
    }
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     const organizationList=organization.map(function(item){
       return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
     });
     const roleList=role.map(function(item){
       return (<Option value={String(item.ROLE_ID)} >{item.ROLE_NAME}</Option>)
     });
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;用户名："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}
        //  hasFeedback
         help={isFieldValidating('OPER_ACCOUNT') ? '校验中...' : (getFieldError('OPER_ACCOUNT') || []).join(', ')}>
        <Input placeholder="请输入用户名"  {...getFieldProps('OPER_ACCOUNT',{
            rules: [{ max: 24, message: '用户名至多为 24 个字符' },{ required: true,whitespace:true,message: '请输入用户名' },{validator: this.checkOperAccount}]
        })} style={{ width: 163 }} />
        </FormItem>
        <FormItem
          label="人员姓名："
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 12 }}
          help={isFieldValidating('EMPL_NAME') ? '校验中...' : (getFieldError('EMPL_NAME') || []).join(', ')}>
        <Input placeholder="请输入姓名" {...getFieldProps('EMPL_NAME',{
            rules: [{ max: 24, message: '人员姓名至多为 24 个字符' },{ required: true,whitespace:true, message: '请输入姓名' },{validator: this.checkEmplName}]
        })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="人员工号："
         labelCol={{ span: 8}}
         wrapperCol={{ span: 12 }}
         help={isFieldValidating('EMPL_CODE') ? '校验中...' : (getFieldError('EMPL_CODE') || []).join(', ')}>
       <Input placeholder="请输入人员工号" {...getFieldProps('EMPL_CODE',{
           rules: [{ max: 24, message: '人员工号至多为 24 个字符' },{ required: true,whitespace:true, message: '请输入人员工号' },{validator: this.checkEmplCode}]
       })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;身份卡号： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}
        help={isFieldValidating('EMPL_CARD_CODE') ? '校验中...' : (getFieldError('EMPL_CARD_CODE') || []).join(', ')}>
        <Input placeholder="请输入身份卡号" {...getFieldProps('EMPL_CARD_CODE',{
            rules: [{ max: 24, message: '身份卡号至多为 24 个字符' },{validator: this.checkEmplCardCode}]
        })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="归属组织： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Select id="select" size="large" placeholder="请选择归属组织" {...getFieldProps('ORG_ID',{
            rules: [{ required: true, message: '请选择归属组织' }]
        })} style={{ width: 163 }}>
          {organizationList}
        </Select>
      </FormItem>
      <FormItem
        label="角色分配："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
        <Select id="select" size="large" placeholder="请选择角色" {...getFieldProps('ROLE_ID',{
            rules: [{ required: true, message: '请选择角色' },{validator: this.checkOther}]
        })} style={{ width: 163 }}>
          {roleList}
        </Select>
     </FormItem>
     <FormItem
       label="终端授权： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:15 }}>
       <Select id="select" size="large" placeholder="请选择是否授权" {...getFieldProps('OPER_TERM_IF_AUTH',{
           rules: [{ required: true, message: '请选择是否授权' },{validator: this.checkOther}]
       })} style={{ width: 163 }}>
         <Option value="0">否</Option>
         <Option value="1">是</Option>
       </Select>
     </FormItem>
     <FormItem
       label="员工性别： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:12 }}>
       <Select id="select" size="large" placeholder="请选择性别"  {...getFieldProps('EMPL_SEX',{
           rules: [{ required: true, message: '请选择性别' },{validator: this.checkOther}]
       })} style={{ width: 163 }}>
         <Option value="1">男</Option>
         <Option value="0">女</Option>
       </Select>
     </FormItem>
     <FormItem
       label="&nbsp;&nbsp;&nbsp;&nbsp;出生日期： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:12 }}>
       <DatePicker {...getFieldProps('EMPL_BIRTHDAY',{
           rules: [{validator: this.checkOther}]
       })} style={{ width: 163 }} />
     </FormItem>
     <FormItem
       label="&nbsp;&nbsp;&nbsp;电子邮箱："
       labelCol={{ span: 8}}
       wrapperCol={{ span: 12 }}>
     <Input placeholder="请输入电子邮箱" {...getFieldProps('EMPL_EMAIL',{
         rules: [{ max: 124, message: '电子邮箱至多为 124 个字符' },{ type: 'email', message: '请输入正确的邮箱' }],
         validateTrigger:'onBlur'
     })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="&nbsp;&nbsp;&nbsp;&nbsp;手机号码："
        labelCol={{ span: 8}}
        wrapperCol={{ span: 12 }}>
      <Input placeholder="请输入手机号码" {...getFieldProps('EMPL_MOBILE',{
        rules: [{ pattern: /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/, message: '请输入正确的手机号码' }],
        validateTrigger:'onBlur'
      })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;办公电话："
         labelCol={{ span: 8}}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入办公电话" {...getFieldProps('EMPL_OFFICE_PHONE',{
         rules: [{ pattern: /^(^0\\d{2}-?\\d{8}$)|(^0\\d{3}-?\\d{7}$)|(^\\(0\\d{2}\\)-?\\d{8}$)|(^\\(0\\d{3}\\)-?\\d{7}$)$/, message: '请输入正确的办公电话' }],
         validateTrigger:'onBlur'
       })} style={{ width: 163 }}/>
        </FormItem>
        <FormItem
          label="住址："
          labelCol={{ span:4}}
          wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入住址" {...getFieldProps('EMPL_ADDRESS',{
             rules: [{ max: 124, message: '住址至多为 124 个字符' }]
        })} style={{ width: 405 }} />
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
const Employee= React.createClass({
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
        params=commonFunction.objExtend({},params);
    }
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/employee/list',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:params,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.data.O_T_EMPLOYEE.count;
        pagination.current = result.data.O_T_EMPLOYEE.currentPage;
        organization=result.data.O_T_ORGANIZATION;
        role=result.data.O_T_ROLE;
        this.setState({
          loading: false,
          data: result.data.O_T_EMPLOYEE.data,
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
      url:web_config.http_request_domain+'/proc/employee/update',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin:web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.EMPL_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.EMPL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(params.EMPL_NAME+'，编辑失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/employee/delete',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:deleteParams,
      crossOrigin:web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.EMPL_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.EMPL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.EMPL_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=commonFunction.objExtend({},data);
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/employee/add',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:addParams,
      crossOrigin:web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(addParams.EMPL_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(addParams.EMPL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(addParams.EMPL_NAME+'，添加失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchResetPassword(evtName,data){
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/employee/resetpassword',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:data,
      crossOrigin:web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(data.EMPL_NAME+'，重置密码成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(data.EMPL_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(data.EMPL_NAME+'，重置密码失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 人员编辑 的事件
    PubSub.subscribe("Edit",this.fetchEdit);
    // 订阅 人员新增 的事件
    PubSub.subscribe("Add",this.fetchAdd);
    // 订阅 人员删除 的事件
      PubSub.subscribe("Delete",this.fetchDelete);
    // 订阅 重置密码 的事件
    PubSub.subscribe("ResetPassword",this.fetchResetPassword);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe('Edit');
    PubSub.unsubscribe('Add');
    PubSub.unsubscribe('Delete');
    PubSub.unsubscribe('ResetPassword');
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
    PubSub.publish("employeeReset",{});
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
      <Col span="4"><SearchInput placeholder="输入用户名或姓名搜索" onSearch={this.fetchList} /> </Col>
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
            rowKey={record => record.EMPL_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default Employee;
