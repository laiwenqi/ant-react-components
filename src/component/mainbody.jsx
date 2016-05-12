import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import { Menu, Icon ,Tabs ,Popover,Modal,Form,Button,Row,Col,Input,Select,DatePicker  } from 'antd';
import classNames from 'classnames';
import TabsContent from './tabscontent.jsx';
import './mainbody.less';
const SubMenu = Menu.SubMenu; //下级菜单
const TabPane = Tabs.TabPane; //标签页

const createForm = Form.create;
const FormItem = Form.Item;
function noop() {
  return false;
}


/* //顶部头部组件 */
const MAINBODY_HEADER= React.createClass({
  getInitialState() {
    return {
        visible:false,
        updatePwdVisiable:false,
        updateUserInfoVisiable:false
      }
  },
  componentDidMount() {
      PubSub.subscribe("closePwd",this.hideUpdatePwd);
      PubSub.subscribe("closeUserInfo",this.hideUpdateUserInfo);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe('closePwd');
    PubSub.unsubscribe('closeUserInfo');
  },
  handleVisibleChange(){
    this.setState({
      visible:true
    });
  },

  showUpdatePwd(){
    this.setState({
      updatePwdVisiable:true
    });
  },
  hideUpdatePwd(){
    this.setState({
      updatePwdVisiable:false
    });
  },

  showUpdateUserInfo(){
    this.setState({
      updateUserInfoVisiable:true
    });
  },
  hideUpdateUserInfo(){
    this.setState({
      updateUserInfoVisiable:false
    });
  },
  render() {
    const content = (
          <div>
          <p onClick={this.showUpdateUserInfo} className="loginUser-dialog-item">修改信息</p>
          <br />
          <p onClick={this.showUpdatePwd} className="loginUser-dialog-item">修改密码</p>
          <br />
          <p className="loginUser-dialog-item"><a href="/proc/logout" style={{color:'black'}} >退出登录</a></p>
        </div>
    );

    return (
      <div id="header-wrapper">
        <span className="span1" ><a href="/" style={{color:"#fefefe"}}>{ OP_CONFIG.PingTaiName }</a></span>
        <Popover placement="bottom" overlay={content} trigger="hover" >
          <div className="loginUser-item" >
            欢迎您，{ OP_CONFIG.userInfo.nickname }
            &nbsp;&nbsp;
            <Icon  type="down" />
          </div>
       </Popover>

       <Modal ref="modal"
        width="500"
                visible={this.state.updatePwdVisiable}
                title="修改密码"
                onCancel={this.hideUpdatePwd}
                footer={null}>
                <Pwd visible={this.state.updatePwdVisiable}/>
        </Modal>


        <Modal ref="modal"
         width="500"
                 visible={this.state.updateUserInfoVisiable}
                 title="修改信息"
                 onCancel={this.hideUpdateUserInfo}
                 footer={null}>
                 <UserInfo visible={this.state.updateUserInfoVisiable}/>
         </Modal>

      </div>
    )
  }
});





let Pwd = React.createClass({
  getInitialState() {
    return {
      visiable:false,
      passBarShow: false, // 是否显示密码强度提示条
      rePassBarShow: false,
      passStrength: 'L', // 密码强度
      rePassStrength: 'L',
    };
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
      this.setState({ passBarShow: false,rePassBarShow: false });
    }
  },
  handleSubmit() {
    this.props.form.validateFields((errors, values) => {
      if (!!errors) {
        console.log('Errors in form!!!');
        return;
      }
      this.setState({ loading: true });
      reqwest({
        url:web_config.http_request_domain+'/proc/editempl/editPwd',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:values,
        crossOrigin:web_config.http_request_cross, //跨域
        type: "json",
        success: (result) => {
            this.setState({
              loading:false
            });

            result.data.ERROR==0 && (window.location.href="/") && commonFunction.MessageTip('修改密码成功',2,'success');
            result.data.ERROR!=0 && commonFunction.MessageTip('修改密码失败，'+result.data.MSG,2,'error');
            PubSub.publish("closePwd",{});
        },
        error:()=>{
          this.setState({
            loading:false
          });
          commonFunction.MessageTip('修改密码失败',2,'error');
          PubSub.publish("closePwd",{});
        }
      });

    });
  },
  handleCancel(){
    PubSub.publish("closePwd",{});
  },
  getPassStrenth(value, type) {
    if (value) {
      let strength;
      // 密码强度的校验规则自定义，这里只是做个简单的示例
      if (value.length < 6) {
        strength = 'L';
      } else if (value.length <= 9) {
        strength = 'M';
      } else {
        strength = 'H';
      }
      if (type === 'pass') {
        this.setState({ passBarShow: true, passStrength: strength });
      } else {
        this.setState({ rePassBarShow: true, rePassStrength: strength });
      }
    } else {
      if (type === 'pass') {
        this.setState({ passBarShow: false });
      } else {
        this.setState({ rePassBarShow: false });
      }
    }
  },

  checkPass(rule, value, callback) {
    const form = this.props.form;
    this.getPassStrenth(value, 'pass');

    if (form.getFieldValue('pass')) {
      form.validateFields(['rePass'], { force: true });
    }

    callback();
  },

  checkPass2(rule, value, callback) {
    const form = this.props.form;
    this.getPassStrenth(value, 'rePass');

    if (value && value !== form.getFieldValue('pass')) {
      callback('两次输入密码不一致！');
    } else {
      callback();
    }
  },

  renderPassStrengthBar(type) {
    const strength = type === 'pass' ? this.state.passStrength : this.state.rePassStrength;
    const classSet = classNames({
      'ant-pwd-strength': true,
      'ant-pwd-strength-low': strength === 'L',
      'ant-pwd-strength-medium': strength === 'M',
      'ant-pwd-strength-high': strength === 'H'
    });
    const level = {
      L: '弱',
      M: '中',
      H: '高'
    };

    return (
      <div>
        <ul className={classSet}>
          <li className="ant-pwd-strength-item ant-pwd-strength-item-1"></li>
          <li className="ant-pwd-strength-item ant-pwd-strength-item-2"></li>
          <li className="ant-pwd-strength-item ant-pwd-strength-item-3"></li>
          <span className="ant-form-text">
            {level[strength]}
          </span>
        </ul>
      </div>
    );
  },

  render() {
    const { getFieldProps } = this.props.form;

    const passProps = getFieldProps('pass', {
      rules: [
        { required: true, whitespace: true, message: '请填写密码' },
        { validator: this.checkPass }
      ],
      onChange: (e) => {
        console.log('你的密码就是这样被盗的：', e.target.value);
      },
    });
    const rePassProps = getFieldProps('rePass', {
      rules: [{
        required: true,
        whitespace: true,
        message: '请再次输入密码',
      }, {
        validator: this.checkPass2,
      }],
    });
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 18 },
    };
    return (
      <div>
        <Form horizontal form={this.props.form}>
          <Row>
            <Col span="18">
              <FormItem
                {...formItemLayout}
                label="密码：">
                <Input {...passProps} type="password"
                  onContextMenu={noop} onPaste={noop} onCopy={noop} onCut={noop}
                  autoComplete="off" id="pass"

                />
              </FormItem>
            </Col>
            <Col span="6">
              {this.state.passBarShow ? this.renderPassStrengthBar('pass') : null}
            </Col>
          </Row>

          <Row>
            <Col span="18">
              <FormItem
                {...formItemLayout}
                label="确认密码：">
                <Input {...rePassProps} type="password"
                  onContextMenu={noop} onPaste={noop} onCopy={noop} onCut={noop}
                  autoComplete="off" id="rePass"

                />
              </FormItem>
            </Col>
            <Col span="6">
              {this.state.rePassBarShow ? this.renderPassStrengthBar('rePass') : null}
            </Col>
          </Row>
          <hr className="hr"/>
          <Button type="ghost" style={{marginLeft:300}}  onClick={this.handleCancel}>取消</Button>
          <Button type="primary" style={{marginLeft:20}}  onClick={this.handleSubmit}>提交</Button>
        </Form>
      </div>
    );
  }
});

Pwd = createForm()(Pwd);




let UserInfo = React.createClass({
  getInitialState() {
    return {
      loading:false,//确定按钮状态
      nochangecontentV:[],//这个用来对比是不是和原来的值一样，暂时用这个办法
      contentV:[]
    };
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
        this.fetchList();
    }
  },
  fetchList(){
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/editempl/list',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:'',
      crossOrigin:web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          this.setState({
            loading: false
          });
          return;
        }
          this.setState({
            nochangecontentV:result.data.employee_list,
            contentV:result.data.employee_list,
            loading:false
          });
      },
      error:()=>{
        commonFunction.MessageTip('获取数据失败',2,'error');
      }
    });
  },
  componentDidMount() {
  this.fetchList();
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
     let bProps = Object.getOwnPropertyNames(this.state.nochangecontentV[0]);
     let hasChanged=0; /*0表示没有改变*/
       for (let i = 0; i < aProps.length; i++) {
         let propName = aProps[i];
         if (values[propName] != this.state.nochangecontentV[0][propName]) {
           hasChanged=1;
        }
       }
     if(hasChanged==0){
       PubSub.publish("closeUserInfo",{});
       return;
     }
     values['EMPL_BIRTHDAY']=commonFunction.formatTime(values['EMPL_BIRTHDAY'],'yyyy-MM-dd hh:mm:ss');
     this.setState({ loading: true });
     reqwest({
       url:web_config.http_request_domain+'/proc/editempl/update',
       method: 'POST',
       timeout :web_config.http_request_timeout,
       data:values,
       crossOrigin:web_config.http_request_cross, //跨域
       type: "json",
       success: (result) => {
           this.setState({
             loading:false
           });
           result.data.ERROR==0 && commonFunction.MessageTip('修改信息成功',2,'success');
           result.data.ERROR!=0 && commonFunction.MessageTip('修改信息失败，'+result.data.MSG,2,'error');
           PubSub.publish("closeUserInfo",{});
       },
       error:()=>{
         this.setState({
           loading:false
         });
         commonFunction.MessageTip('修改信息失败',2,'error');
         PubSub.publish("closeUserInfo",{});
       }
     });


    });
  },
  handleCancel(){
       PubSub.publish("closeUserInfo",{});
  },
  checkEmplName(rule, value, callback){
    //对比，如果和原来的值一样就不做校验了
    if(this.state.nochangecontentV[0].EMPL_NAME==value){
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
        <Form inline onSubmit={this.handleSubmit}  form={this.props.form}>
          <FormItem label="&nbsp;&nbsp;&nbsp;&nbsp;用户名："
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入用户名" disabled={true} d{...getFieldProps('OPER_ACCOUNT',{
              initialValue:this.state.contentV.length==0?"":this.state.contentV[0].OPER_ACCOUNT
            })}  />
          </FormItem>
          <FormItem
            label="性别："
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 12 }}>
            <Select id="select" size="large" placeholder="请选择性别"
              {...getFieldProps('EMPL_SEX',{
                rules: [{ required: true, message: '请选择性别' }],
                initialValue:String(this.state.contentV.length==0?"":this.state.contentV[0].EMPL_SEX)
              })} style={{ width: 163 }}>
                <Option value='0' >女</Option>
                <Option value='1' >男</Option>
              </Select>
          </FormItem>

          <FormItem
            label="出生日期："
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 12 }}>
            <DatePicker {...getFieldProps('EMPL_BIRTHDAY',{
                initialValue:this.state.contentV.length==0?"2099-01-01":this.state.contentV[0].EMPL_BIRTHDAY
            })} />
          </FormItem>

          <FormItem
            label="姓名："
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 12 }}
                help={isFieldValidating('EMPL_NAME') ? '校验中...' : (getFieldError('EMPL_NAME') || []).join(', ')}>
            <Input placeholder="请输入姓名" {...getFieldProps('EMPL_NAME',{
                rules: [{ max: 24, message: '姓名至多为 24 个字符' },{ required: true,whitespace:true, message: '请输入姓名' },{validator: this.checkEmplName}],
                initialValue:this.state.contentV.length==0?"":this.state.contentV[0].EMPL_NAME
            })} />
          </FormItem>
          <FormItem
            label="办公电话："
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入办公电话" {...getFieldProps('EMPL_OFFICE_PHONE',{
                rules: [{ pattern: /^(^0\\d{2}-?\\d{8}$)|(^0\\d{3}-?\\d{7}$)|(^\\(0\\d{2}\\)-?\\d{8}$)|(^\\(0\\d{3}\\)-?\\d{7}$)$/, message: '请输入正确的办公电话' }],
                validateTrigger:'onBlur',
                initialValue:this.state.contentV.length==0?"":this.state.contentV[0].EMPL_OFFICE_PHONE
            })} />
          </FormItem>
          <FormItem
            label="&nbsp;&nbsp;&nbsp;&nbsp;邮箱："
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入邮箱" {...getFieldProps('EMPL_EMAIL',{
                rules: [{ max: 124, message: '邮箱至多为 124 个字符' },{ type: 'email', message: '请输入正确的邮箱' },{validator: this.checkOther}],
                validateTrigger:'onBlur',
                initialValue:this.state.contentV.length==0?"":this.state.contentV[0].EMPL_EMAIL
            })} />
          </FormItem>
          <FormItem
            label="手机号码："
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入手机号码" {...getFieldProps('EMPL_MOBILE',{
                rules: [{ pattern: /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/, message: '请输入正确的手机号码' }],
                validateTrigger:'onBlur',
                initialValue:this.state.contentV.length==0?"":this.state.contentV[0].EMPL_MOBILE
            })}/>
          </FormItem>
          <br/>
          <FormItem
            label="住址："
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入住址" {...getFieldProps('EMPL_ADDRESS',{
                rules: [{ max: 124, message: '住址至多为 124 个字符' }],
                initialValue:this.state.contentV.length==0?"":this.state.contentV[0].EMPL_ADDRESS
            })} style={{ width: 350 }} />
          </FormItem>
          <hr className="hr"/>
          <Button type="ghost" style={{marginLeft:300}}  onClick={this.handleCancel}>取消</Button>
          <Button type="primary" style={{marginLeft:20}}  onClick={this.handleSubmit}>提交</Button>

        </Form>
      );
    }
  });

  UserInfo = Form.create()(UserInfo);





/* //主体显示数据区域组件 */
const MAINBODY_CONTENT= React.createClass({
  getInitialState() {
    //默认首页
    const tabs_data =defaultShouye;
    const panes = tabs_data.map(function(item){
      return (<TabPane tab={item.title} key={item.key}><TabsContent component={item.content}/></TabPane>);
    });
    this.newTabIndex = 0;
    return {
        activeKey: panes[0].key,
        current: '1',
        openKeys: [],
        menu_data:mainMenu,
        panes,
      }
    },
    /* //标签页组件部分 */
    onChange(activeKey) {
      this.setState({ activeKey });
    },
    onEdit(targetKey, action) {
      this[action](targetKey);
    },
    add() {
      const panes = this.state.panes;
      const activeKey = `newTab${this.newTabIndex++}`;
      panes.push(<TabPane tab="新建页签" key={activeKey}>新页面内容</TabPane>);
      this.setState({ panes, activeKey });
    },
    remove(targetKey) {
      let activeKey = this.state.activeKey;
      let lastIndex;
      this.state.panes.forEach((pane, i) => {
        if (pane.key === targetKey) {
          lastIndex = i - 1;
        }
      });
      const panes = this.state.panes.filter(pane => pane.key !== targetKey);
      if (lastIndex >= 0 && activeKey === targetKey) {
        activeKey = panes[lastIndex].key;
      }
      this.setState({ panes, activeKey });
    },
    /* //菜单栏组件部分 */
    handleClick(e) {
          let lastIndex;
          let panes = this.state.panes;
          let activeKey = this.state.activeKey;
          let exist_panes=[]; /*已存在的标签的key*/
          panes.forEach((pane, i) => {
              exist_panes.push(pane.key);
          });
          panes.forEach((pane, i) => {
            if(exist_panes.indexOf(e.key)!=-1){
              activeKey=e.key;
              return;
            }
            if (pane.key !== e.key) {
              activeKey = e.key;
              panes.push(<TabPane hideCloseIcon={true} tab={e.item.props.title} key={e.key}><TabsContent component={e.item.props.content}/></TabPane>);
              exist_panes.push(e.key);
            }
          });
          this.setState({
            current: e.key,
            openKeys:e.keyPath.slice(1),
            panes,
            activeKey
          });
    },
    onToggle(info) {
          this.setState({
            openKeys: info.open ? info.keyPath : info.keyPath.slice(1)
          });
    },
  render() {
    let handlemenuClick=this.handlemenuClick;
    let menu_content,menu_item_content;
    menu_content = this.state.menu_data.map(function (item) {
      menu_item_content=item.contain.map(function (contain_item) {
        return (
          <Menu.Item key={contain_item.key} content={contain_item.content} title={contain_item.name}><div className="mainbody-menu-item">{contain_item.name}</div></Menu.Item>
        )
      });


      if (item.contain.length!=0) {
        return (
          <SubMenu key={ item.key }  title={<span><Icon type={ item.icon } /><span>{ item.title }</span></span>} >
               { menu_item_content }
          </SubMenu>
        )
      }else {
        return (<div></div>) ;
      }

   });
    return (
      <div>
        <div id="content-wrapper">
          <div id="main-body-content">
              <Tabs onChange={this.onChange} activeKey={this.state.activeKey}
                type="homePage-card" onEdit={this.onEdit}>
                {this.state.panes}
              </Tabs>
          </div>
        </div>
        <div id="sidebar-wrapper">
          <div id="menu-wrapper">
            <Menu onClick={this.handleClick}
              style={{ width: 240 }} /*菜单宽度*/
              openKeys={this.state.openKeys}
              onOpen={this.onToggle}
              onClose={this.onToggle}
              selectedKeys={[this.state.current]}
              mode="inline"
              theme="dark" >
            { menu_content }
            </Menu>
          </div>
        </div>
      </div>
    )
  }
});



{/* //左侧菜单组件 */}
const MAINBODY_MENU= React.createClass({
  render() {
    return (
      <div></div>
    )
  }
});

{/* //整个页面主体框架组件 */}
const MAINBODY= React.createClass({
  getInitialState() {
      return {

      }
    },
  render() {
    return (
      <div>
        <MAINBODY_HEADER onClick={this.handleOk}></MAINBODY_HEADER>
        <MAINBODY_CONTENT></MAINBODY_CONTENT>
      </div>
    )
  }
});
export default MAINBODY;
