import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import {Breadcrumb,Transfer, Cascader ,TimePicker ,Tree,Steps,Badge,DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm, message,Icon, Button,Dropdown,Menu,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';

import Service from '../web/device_service.jsx';

import './device.less';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;
const Step = Steps.Step;
const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;
const TreeNode = Tree.TreeNode;


//页面名称
const PageName='device';

//定义组织
let organization;

//定义系统
let system;

//定义终端类型
let devType;


//定义版本
let version;

//定义配置文件
let configFile;


//定义设备使用状态
const devStatus=[
  {value:'0',text:"暂停使用",dotColor:'#FFA500'},
  {value:'1',text:"可用",dotColor:'#87d068'},
  {value:'3',text:"已报废",dotColor:'#red'}
];

const devStatusList=devStatus.map(function(item){
    return (<Option value={String(item.value)} >{item.text}</Option>)
});



const options = [{
  value: 'zhejiang',
  label: '浙江',
  children: [{
    value: 'hangzhou',
    label: '杭州',
    children: [{
      value: 'xihu',
      label: '西湖',
    }],
  }],
}, {
  value: 'jiangsu',
  label: '江苏',
  children: [{
    value: 'nanjing',
    label: '南京',
    children: [{
      value: 'zhonghuamen',
      label: '中华门',
    }],
  }],
}];

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
    for(let i in devStatus){
      if(row.DEV_USE_STATE==devStatus[i].value){
        let backgroundColor=devStatus[i].dotColor;
        return (
          <div ><Badge dot style={{backgroundColor}}/><span className="status-word">{devStatus[i].text}</span></div>
        )
      }
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





//这里是默认简易的搜索
let SearchInput = React.createClass({
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
    PubSub.unsubscribe(PageName+"Reset");
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
      <Form inline  onSubmit={this.handleSubmit} >
        <br/>
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
      stepCurrent:0,//步骤条已完成的步骤数
      sureButtonWord:'下一步',
      lastStepButtonVisible:"el-display-none",
      stepVisible:["","el-display-none","el-display-none","el-display-none","el-display-none"],
      loading:false,//确定按钮状态
      nochangecontentV:this.props.contentValue,//这个用来对比是不是和原来的值一样，暂时用这个办法
      contentV:this.props.contentValue,
      isuse:this.props.contentValue.INUSE==0?false:true,
      version:this.props.contentValue.DVTP_ID,
      params:[],//配置参数的
      module:[],//配置模块的
      fittings:[],//模块配件的
      file:[],//配置文件的
      targetKeys:[],
      mockData:configFile
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.setState({
        targetKeys:[],
        loading:false,
        stepCurrent:0,
        sureButtonWord:"下一步",
        lastStepButtonVisible:"el-display-none",
        stepVisible:["","el-display-none","el-display-none","el-display-none","el-display-none"]
      });
      this.props.form.resetFields();
    }
  },
  handleNext(){
    let i=this.state.stepCurrent;
    this.state.stepVisible[i]="el-display-none";
    this.state.stepVisible[i+1]="";
    if(i==0){
      const {  getFieldValue } = this.props.form;
      //加载参数配置
      let paramsDate,paramsUrl='';
      let DVMD_ID=getFieldValue("DVMD_ID");
      if(this.state.nochangecontentV.DVMD_ID == DVMD_ID){
        paramsUrl='/proc/device/typeparalist2';
        paramsDate={DEV_ID:this.state.nochangecontentV.DEV_ID};
      }else{
        paramsUrl='/proc/device/typeparalist';
        paramsDate={DVMD_ID:DVMD_ID};
      }

      reqwest({
        url:web_config.http_request_domain+paramsUrl,
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:paramsDate,
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
          this.setState({
            params:result.data.RESULT
          });
        },
        error:()=>{
          commonFunction.MessageTip('获取数据失败',2,'error');
          this.setState({
            loading: false
          });
        }
      });
    }

    if(i==1){
      const {  getFieldValue } = this.props.form;
      //加载模块配置
      reqwest({
        url:web_config.http_request_domain+'/proc/device/modulelist2',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{DVMD_ID:getFieldValue("DVMD_ID"),DEV_ID:this.state.nochangecontentV.DEV_ID},
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
          this.setState({
            module:result.data.RESULT,
            fittings:result.data.RESULT.O_FITTINGS
          });
        },
        error:()=>{
          commonFunction.MessageTip('获取数据失败',2,'error');
          this.setState({
            loading: false
          });
        }
      });
    }


    if(i==2){
      const {  getFieldValue } = this.props.form;
      //加载文件配置
      reqwest({
        url:web_config.http_request_domain+'/proc/device/config',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{DEV_ID:this.state.nochangecontentV.DEV_ID},
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
          this.setState({
              targetKeys:result.data.RESULT
          });
        },
        error:()=>{
          commonFunction.MessageTip('获取数据失败',2,'error');
          this.setState({
            loading: false
          });
        }
      });
    }


    //完成了
    if(this.state.stepCurrent>=3){
      this.handleSubmit();
      return;
    }
    if(this.state.stepCurrent==2){
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
    let i=this.state.stepCurrent;
    this.state.stepVisible[i]="el-display-none";
    this.state.stepVisible[i-1]="";
    if(this.state.stepCurrent==1){
      this.setState({
        stepCurrent:this.state.stepCurrent-1,
        sureButtonWord:"下一步",
        lastStepButtonVisible:"el-display-none",
        stepVisible:["","el-display-none","el-display-none","el-display-none","el-display-none"]
      });
      return;
    }
    this.setState({
      stepCurrent:this.state.stepCurrent-1,
      sureButtonWord:"下一步"
    });
  },
  handleSubmit(e) {
  //  e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        commonFunction.MessageTip('编辑信息有误',2,'warn');
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

      let v=commonFunction.objExtend({},values);
      v.DEV_END_TIME=commonFunction.formatTime(v.DEV_END_TIME,"hh:mm");
      v.DEV_START_TIME=commonFunction.formatTime(v.DEV_START_TIME,"hh:mm");
      v.DEV_END_TIME = v.DEV_END_TIME.replace(/:/g,"");
      v.DEV_START_TIME = v.DEV_START_TIME.replace(/:/g,"");


      let params=commonFunction.objExtend({DEV_ID:this.state.nochangecontentV.DEV_ID},v);

      //这里是处理参数配置数据
      let devparams=[];
      for(let i in params){
          if(/^settingParams_/.test(i) && typeof params[i]=='string' ){
            if (values['DVMD_ID'] != this.state.nochangecontentV['DVMD_ID']) {
              devparams.push({
                DVMD_ID:values['DVMD_ID'],
                DEV_ID:'',
                DVTP_ID:'',
                DVPR_VALUE:params[i],
                DVPR_NAME:i.replace(/settingParams_/, ""),
                DVPR_CLASS:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVTP_CLASS,
                DVPR_DESC_NAME:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_DESC_NAME,
                DVPR_VAL_TYPE:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_VAL_TYPE,
                DVPR_IF_KEY:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_IF_KEY,
                DVPR_INFO:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_INFO,
                IS_USING:1
              });
            }else{
              devparams.push({
                DVMD_ID:values['DVMD_ID'],
                DEV_ID:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DEV_ID,
                DVTP_ID:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVTP_ID,
                DVPR_VALUE:params[i],
                DVPR_NAME:i.replace(/settingParams_/, ""),
                DVPR_CLASS:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVPR_CLASS,
                DVPR_DESC_NAME:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVPR_DESC_NAME,
                DVPR_VAL_TYPE:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVPR_VAL_TYPE,
                DVPR_IF_KEY:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVPR_IF_KEY,
                DVPR_INFO:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVPR_INFO,
                IS_USING:1
              });
            }
          }
      }

      //这里是处理模块配置数据
      let devmodule=[];
      for(let i in params){
          if(/^settingModule_/.test(i) && typeof params[i]=='string' ){
            devmodule.push({
              DVFT_ID:params[i],
              DEV_ID:'',
              DFTG_NO:values["settingModule_"+i.replace(/settingModule_/, "")+"_DATA"].DVML_NO,
              DFTG_MODULE_NAME:values["settingModule_"+i.replace(/settingModule_/, "")+"_DATA"].DVML_NAME,
              DFTG_TYPE:values["settingModule_"+i.replace(/settingModule_/, "")+"_DATA"].DVML_TYPE,
              DFTG_NAME:'',
              DFTG_PRODUCER:'',
              DFTG_VERSION:'',
              DFTG_STANDARD:'',
              DFTG_PARAM:'',
              DFTG_CHANNEL_NUM:'',
              DFTG_DESC:'',
              IS_USING:1
            });
          }
      }

      //这里是模块配置数据
      let devconfig=[];
      for(let i=0;i<this.state.targetKeys.length;i++){
        devconfig.push({
          DEV_ID:'',
          DVCF_ID:this.state.targetKeys[i]
        });
      }

      params=commonFunction.objExtend({
        TYPEPARA:JSON.stringify(devparams),
        MODULE:JSON.stringify(devmodule),
        CONFIG:JSON.stringify(devconfig)
      },params);


      //发布 编辑 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish(PageName+"Edit",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  handleDevTypeChange(value){
    this.setState({
      version:value
    });
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
  handleConfigFileChange(targetKeys, direction, moveKeys){
      this.setState({ targetKeys });
  },
  render() {
     const { getFieldValue,getFieldProps, getFieldError, isFieldValidating } = this.props.form;


     const organizationList=organization.map(function(item){
        return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
     });

     const systemList=system.map(function(item){
        return (<Option value={String(item.DEV_ID)} >{item.DEV_NAME}</Option>)
     });

     const devTypeList=devType.map(function(item){
        return (<Option value={String(item.DVTP_ID)} >{item.DVTP_NAME}</Option>)
     });

     let versionList=[];
     if(typeof version[this.state.version]!='undefined'){
      versionList=version[this.state.version].map(function(item){
         return (<Option value={String(item.DVMD_ID)} >{item.DVMD_VER}</Option>)
      });
     }



     let paramsHtml='';
     if(this.state.params.length>0){
       if(this.state.nochangecontentV.DVMD_ID==getFieldValue("DVMD_ID")){
         paramsHtml=this.state.params.map(function(item){
           return(
             <div className="div-inline">
             <FormItem
               label={item.DVPR_NAME+"："}>
               <Input placeholder={"请输入参数"+item.DVPR_NAME}  {...getFieldProps("settingParams_"+item.DVPR_NAME,{
                   rules: [{ required: item.DVPR_IF_KEY==1?true:false, message: '请填写参数'+item.DVPR_NAME }],
                   initialValue:item.DVPR_VALUE
               })}  style={{ width: 163 }} />
             </FormItem>
             <div className="el-display-none">
                 <FormItem>
                   <Input className="el-display-none"   {...getFieldProps("settingParams_"+item.DVPR_NAME+"_DATA",{
                       initialValue:item
                   })}  />
                 </FormItem>
             </div>
             </div>
           )
         });
       }else{
         paramsHtml=this.state.params.map(function(item){
           return(
             <div className="div-inline">
             <FormItem
               label={item.DTPR_NAME+"："}>
               <Input placeholder={"请输入参数"+item.DTPR_NAME}  {...getFieldProps("settingParams_"+item.DTPR_NAME,{
                   rules: [{ required: item.DTPR_IF_KEY==1?true:false, message: '请填写参数'+item.DTPR_NAME }],
                   initialValue:item.DTPR_DEFAULT_VAL
               })}  style={{ width: 163 }} />
             </FormItem>
             <div className="el-display-none">
                 <FormItem>
                   <Input className="el-display-none"   {...getFieldProps("settingParams_"+item.DTPR_NAME+"_DATA",{
                       initialValue:item
                   })}  />
                 </FormItem>
             </div>
             </div>
           )
         });
       }

     }

     let moduleHtml='';
     if(this.state.module.length>0){
       moduleHtml=this.state.module.map(function(item){
         let fittings=JSON.parse(item.CHOOSE);
         let fittingsList=fittings.map(function(item){
           return  (<Option value={String(item.VALUE)} >{item.TEXT}</Option>)
         });
         return(
            <div className="div-inline">
           <FormItem
             label={item.DVML_NAME+"："}>
               <Select id="select" size="large" placeholder={"请选择"+item.DVML_NAME} {...getFieldProps('settingModule_'+item.DVML_ID,{
                   rules: [{ required:true, message: '请选择模块配件'}],
                   initialValue:String(item.VALUE)
               })} style={{ width: 300 }}>
                 { fittingsList }
               </Select>
           </FormItem>
           <div className="el-display-none">
               <FormItem>
                 <Input className="el-display-none"   {...getFieldProps("settingModule_"+item.DVML_ID+"_DATA",{
                     initialValue:item
                 })}  />
               </FormItem>
           </div>
            </div>
         )
       });
     }

     return (
       <div>
       <Steps current={this.state.stepCurrent}>
        <Step title="基本信息" />
        <Step title="参数"  />
        <Step title="模块"  />
        <Step title="文件"  />
      </Steps>
      <br/>
       <Form inline form={this.props.form}>

       <div className={this.state.stepVisible[0]} style={{marginLeft:30}} >
          <FormItem
             label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;终端名："
             labelCol={{ span: 8 }}
             wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入终端名" {...getFieldProps('DEV_NAME',{
                rules: [{ required: true, message: '请输入终端名' }],
                initialValue:this.state.contentV.DEV_NAME
            })}  style={{ width: 163 }} />
          </FormItem>
          <FormItem
            label="序列号："
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 12 }}>
           <Input placeholder="请输入序列号" disabled={this.state.isuse} {...getFieldProps('DEV_SN',{
               rules: [{ required: true, message: '请输入序列号' }],
               initialValue:this.state.contentV.DEV_SN
           })}  style={{ width: 163 }} />
          </FormItem>
          <FormItem
             label="归属组织： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select id="select" size="large" placeholder="请选择归属组织" {...getFieldProps('ORG_ID',{
                 rules: [{ required: true, message: '请选择归属组织' }],
                 initialValue:String(this.state.contentV.ORG_ID)
             })} style={{ width: 163 }}>
               { organizationList }
             </Select>
           </FormItem>
           <FormItem
             label="归属系统： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select id="select" size="large" placeholder="请选择归属系统" {...getFieldProps('DEV_PARENT_ID',{
                 rules: [{ required: true, message: '请选择归属系统' }],
                 initialValue:String(1)
             })} style={{ width: 163 }}>
               { systemList }
             </Select>
           </FormItem>
           <FormItem
             label="终端类型： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select disabled={this.state.isuse} id="select" size="large" placeholder="请选择终端类型" {...getFieldProps('DVTP_ID',{
                 rules: [{ required: true, message: '请选择终端类型' }],
                 initialValue:String(this.state.contentV.DVTP_ID),
                 onChange:this.handleDevTypeChange
             })} style={{ width: 163 }}>
               { devTypeList }
             </Select>
           </FormItem>
           <FormItem
             label="终端版本： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select id="select" size="large" placeholder="请选择终端版本" {...getFieldProps('DVMD_ID',{
                 rules: [{ required: true, message: '请选择终端版本' }],
                 initialValue:String(this.state.contentV.DVMD_ID)
             })} style={{ width: 163 }}>
                { versionList }
             </Select>
           </FormItem>

           <FormItem
             label="&nbsp;&nbsp;工作时间： "
             required>
              <TimePicker placeholder="开始时间"  format="HH:mm" {...getFieldProps('DEV_START_TIME',{
                  //rules: [{ required: true, message: '请选择开始时间' }],
                  initialValue:this.state.contentV.DEV_START_TIME==0?commonFunction.insert_flg("0000",":",2):commonFunction.insert_flg(commonFunction.fillingStr(this.state.contentV.DEV_START_TIME,'0',4,0),":",2)
              })} />
                  &nbsp;&nbsp;  ~ &nbsp;&nbsp;
              <TimePicker placeholder="结束时间"   format="HH:mm" {...getFieldProps('DEV_END_TIME',{
                  //rules: [{ required: true, message: '请选择结束时间'}],
                  initialValue:this.state.contentV.DEV_END_TIME==0?commonFunction.insert_flg("0000",":",2):commonFunction.insert_flg(commonFunction.fillingStr(this.state.contentV.DEV_END_TIME,'0',4,0),":",2)
              })} />
           </FormItem>
           <FormItem
             label="使用状态： ">
             <Select id="select" size="large" placeholder="请选择使用状态" {...getFieldProps('DEV_USE_STATE',{
                 rules: [{ required: true, message: '请选择使用状态' }],
                 initialValue:String(this.state.contentV.DEV_USE_STATE)
             })} style={{ width: 100 }}>
                { devStatusList }
             </Select>
           </FormItem>
           <br/>
           <FormItem
             label="&nbsp;&nbsp;终端地址： "
             required>
             <Cascader placeholder="请选择终端地址"  options={options} expandTrigger="hover" {...getFieldProps('DEV_POSITION')} style={{ width:410 }}  />
           </FormItem>
           <FormItem
             id="control-textarea"
             label="描述："
             labelCol={{ span: 3 }}
             wrapperCol={{ span: 15}}>
             <Input type="textarea" rows="5" {...getFieldProps('DEV_INFO',{
                 rules: [{max: 124, message: '描述至多为 124 个字符'}],
                 initialValue:this.state.contentV.DEV_INFO
             })}  style={{ width: 650 }}/>
           </FormItem>
       </div>

       <div className={this.state.stepVisible[1]} style={{marginLeft:50}}>
           { paramsHtml }
           <div className="margin-top-10"></div>
       </div>

       <div className={this.state.stepVisible[2]} style={{marginLeft:100}}>
          { moduleHtml }
          <div className="margin-top-10"></div>
       </div>

       <div className={this.state.stepVisible[3]} style={{marginLeft:15}}>
          <FormItem style={{marginLeft:10}} >
            <Transfer
               titles={['可选文件','已配置文件']}
               dataSource={this.state.mockData}
               targetKeys={this.state.targetKeys}
               notFoundContent="暂无"
               render={item => item.title}
               listStyle={{
                   width: 240,
                   height: 300,
               }}
               {...getFieldProps('configFile',{
                 onChange:this.handleConfigFileChange
               })} />
           </FormItem>
           <div className="margin-top-10"></div>
       </div>


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
        PubSub.publish(PageName+"Delete",DELETE_PARAMS);
      },
      onCancel() {}
    });
  },
  showService(){
    let DEVICE_PARAMS={
      DEV_ID:this.props.DEV_ID, //需要的ID
      DEV_NAME:this.props.DEV_NAME //需要的名字
    };
    PubSub.publish(PageName+"PeiZhiService",DEVICE_PARAMS);
  },
  render() {
    let deleteButton=(<div></div>);
    if(this.props.INUSE==0){
      deleteButton=(<div className="div-inline"><span className="ant-divider"></span><a type="primary" onClick={this.handleDelete}>删除</a></div>);
    }
    return (
      <div>
        <a type="primary" onClick={this.showService}>配置服务</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.showModal} {...this.props}>编辑</a>
        { deleteButton }


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
        <Button type="primary" onClick={this.showModal} className="table-add-btn">添加终端<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="600"
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
      stepCurrent:0,//步骤条已完成的步骤数
      sureButtonWord:'下一步',
      lastStepButtonVisible:"el-display-none",
      stepVisible:["","el-display-none","el-display-none","el-display-none","el-display-none"],
      loading:false,//确定按钮状态
      params:[],//配置参数的
      module:[],//配置模块的
      fittings:[],//模块配件的
      file:[],//配置文件的
      targetKeys:[],
      mockData:configFile
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.setState({
        targetKeys:[],
        loading:false,
        stepCurrent:0,
        sureButtonWord:"下一步",
        lastStepButtonVisible:"el-display-none",
        stepVisible:["","el-display-none","el-display-none","el-display-none","el-display-none"]
      });
      this.props.form.resetFields();
    }
  },
  handleNext(){
    let i=this.state.stepCurrent;
    this.state.stepVisible[i]="el-display-none";
    this.state.stepVisible[i+1]="";
    if(i==0){
      const {  getFieldValue } = this.props.form;
      //加载参数配置
      reqwest({
        url:web_config.http_request_domain+'/proc/device/typeparalist',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{DVMD_ID:(getFieldValue("DVMD_ID")==null?-1:getFieldValue("DVMD_ID"))},
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
          this.setState({
            params:result.data.RESULT
          });
        },
        error:()=>{
          commonFunction.MessageTip('获取数据失败',2,'error');
          this.setState({
            loading: false
          });
        }
      });
    }

    if(i==1){
      const {  getFieldValue } = this.props.form;
      //加载模块配置
      reqwest({
        url:web_config.http_request_domain+'/proc/device/modulelist',
        method: 'POST',
        timeout :web_config.http_request_timeout,
        data:{DVMD_ID:(getFieldValue("DVMD_ID")==null?-1:getFieldValue("DVMD_ID"))},
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
          this.setState({
            module:result.data.RESULT,
            fittings:result.data.RESULT.O_FITTINGS
          });
        },
        error:()=>{
          commonFunction.MessageTip('获取数据失败',2,'error');
          this.setState({
            loading: false
          });
        }
      });
    }


    if(i==2){
      const {  getFieldValue } = this.props.form;
      //加载文件配置
      // reqwest({
      //   url:web_config.http_request_domain+'/proc/device/config',
      //   method: 'POST',
      //   timeout :web_config.http_request_timeout,
      //   data:{DEV_ID:-1},
      //   crossOrigin: web_config.http_request_cross, //跨域
      //   type: "json",
      //   success: (result) => {
      //     if(result.data.ERROR!=0){
      //       commonFunction.MessageTip(result.data.MSG,2,'error');
      //       this.setState({
      //         loading: false
      //       });
      //       return;
      //     }
      //     this.setState({
      //         targetKeys:result.data.RESULT
      //     });
      //   },
      //   error:()=>{
      //     commonFunction.MessageTip('获取数据失败',2,'error');
      //     this.setState({
      //       loading: false
      //     });
      //   }
      // });
    }


    //完成了
    if(this.state.stepCurrent>=3){
      this.handleSubmit();
      return;
    }
    if(this.state.stepCurrent==2){
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
    let i=this.state.stepCurrent;
    this.state.stepVisible[i]="el-display-none";
    this.state.stepVisible[i-1]="";
    if(this.state.stepCurrent==1){
      this.setState({
        stepCurrent:this.state.stepCurrent-1,
        sureButtonWord:"下一步",
        lastStepButtonVisible:"el-display-none",
        stepVisible:["","el-display-none","el-display-none","el-display-none","el-display-none"]
      });
      return;
    }
    this.setState({
      stepCurrent:this.state.stepCurrent-1,
      sureButtonWord:"下一步"
    });
  },
  handleSubmit(e) {
  //  e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        commonFunction.MessageTip('编辑信息有误',2,'warn');
        console.log('Errors in form!!!');
        return;
      }

      let v=commonFunction.objExtend({},values);
      v.DEV_END_TIME=commonFunction.formatTime(v.DEV_END_TIME,"hh:mm");
      v.DEV_START_TIME=commonFunction.formatTime(v.DEV_START_TIME,"hh:mm");
      v.DEV_END_TIME = v.DEV_END_TIME.replace(/:/g,"");
      v.DEV_START_TIME = v.DEV_START_TIME.replace(/:/g,"");


      let params=v;

      //这里是处理参数配置数据
      let devparams=[];
      for(let i in params){
          if(/^settingParams_/.test(i) && typeof params[i]=='string' ){
            devparams.push({
              DEV_ID:'',
              DVTP_ID:'',
              DVPR_VALUE:params[i],
              DVPR_NAME:i.replace(/settingParams_/, ""),
              DVPR_CLASS:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DVTP_CLASS,
              DVPR_DESC_NAME:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_DESC_NAME,
              DVPR_VAL_TYPE:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_VAL_TYPE,
              DVPR_IF_KEY:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_IF_KEY,
              DVPR_INFO:values["settingParams_"+i.replace(/settingParams_/, "")+"_DATA"].DTPR_INFO,
              IS_USING:1
            });
          }
      }

      //这里是处理模块配置数据
      let devmodule=[];
      for(let i in params){
          if(/^settingModule_/.test(i) && typeof params[i]=='string' ){
            devmodule.push({
              DVFT_ID:params[i],
              DEV_ID:'',
              DFTG_NO:values["settingModule_"+i.replace(/settingModule_/, "")+"_DATA"].DVML_NO,
              DFTG_MODULE_NAME:values["settingModule_"+i.replace(/settingModule_/, "")+"_DATA"].DVML_NAME,
              DFTG_TYPE:values["settingModule_"+i.replace(/settingModule_/, "")+"_DATA"].DVML_TYPE,
              DFTG_NAME:'',
              DFTG_PRODUCER:'',
              DFTG_VERSION:'',
              DFTG_STANDARD:'',
              DFTG_PARAM:'',
              DFTG_CHANNEL_NUM:'',
              DFTG_DESC:'',
              IS_USING:1
            });
          }
      }

      //这里是服务配置数据
      let devconfig=[];
      for(let i=0;i<this.state.targetKeys.length;i++){
        devconfig.push({
          DEV_ID:'',
          DVCF_ID:this.state.targetKeys[i]
        });
      }

      params=commonFunction.objExtend({
        TYPEPARA:JSON.stringify(devparams),
        MODULE:JSON.stringify(devmodule),
        CONFIG:JSON.stringify(devconfig)
      },params);


      //发布 编辑 事件
      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish(PageName+"Add",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  handleDevTypeChange(value){
    this.setState({
      version:value
    });
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
  handleConfigFileChange(targetKeys, direction, moveKeys){
      this.setState({ targetKeys });
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;


     const organizationList=organization.map(function(item){
        return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
     });

     const systemList=system.map(function(item){
        return (<Option value={String(item.DEV_ID)} >{item.DEV_NAME}</Option>)
     });

     const devTypeList=devType.map(function(item){
        return (<Option value={String(item.DVTP_ID)} >{item.DVTP_NAME}</Option>)
     });

     let versionList=[];
     if(typeof version[this.state.version]!='undefined'){
      versionList=version[this.state.version].map(function(item){
         return (<Option value={String(item.DVMD_ID)} >{item.DVMD_VER}</Option>)
      });
     }



     let paramsHtml='';
     if(this.state.params.length>0){
       paramsHtml=this.state.params.map(function(item){
         return(
           <div className="div-inline">
           <FormItem
             label={item.DTPR_NAME+"："}>
             <Input placeholder={"请输入参数"+item.DTPR_NAME}  {...getFieldProps("settingParams_"+item.DTPR_NAME,{
                 rules: [{ required: item.DTPR_IF_KEY==1?true:false, message: '请填写参数'+item.DTPR_NAME }],
                 initialValue:item.DTPR_DEFAULT_VAL
             })}  style={{ width: 163 }} />
           </FormItem>
           <div className="el-display-none">
               <FormItem>
                 <Input className="el-display-none"   {...getFieldProps("settingParams_"+item.DTPR_NAME+"_DATA",{
                     initialValue:item
                 })}  />
               </FormItem>
           </div>
           </div>
         )
       });
     }

     let moduleHtml='';
     if(this.state.module.length>0){
       moduleHtml=this.state.module.map(function(item){
         let fittings=JSON.parse(item.CHOOSE);
         let fittingsList=fittings.map(function(item){
           return  (<Option value={String(item.VALUE)} >{item.TEXT}</Option>)
         });
         return(
            <div className="div-inline">
           <FormItem
             label={item.DVML_NAME+"："}>
               <Select id="select" size="large" placeholder={"请选择"+item.DVML_NAME} {...getFieldProps('settingModule_'+item.DVML_ID,{
                   rules: [{ required:true, message: '请选择模块配件'}],
               })} style={{ width: 300 }}>
                 { fittingsList }
               </Select>
           </FormItem>
           <div className="el-display-none">
               <FormItem>
                 <Input className="el-display-none"   {...getFieldProps("settingModule_"+item.DVML_ID+"_DATA",{
                     initialValue:item
                 })}  />
               </FormItem>
           </div>
            </div>
         )
       });
     }

     return (
       <div>
       <Steps current={this.state.stepCurrent}>
        <Step title="基本信息" />
        <Step title="参数"  />
        <Step title="模块"  />
        <Step title="文件"  />
      </Steps>
      <br/>
       <Form inline form={this.props.form}>

       <div className={this.state.stepVisible[0]} style={{marginLeft:30}} >
          <FormItem
             label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;终端名："
             labelCol={{ span: 8 }}
             wrapperCol={{ span: 12 }}>
            <Input placeholder="请输入终端名" {...getFieldProps('DEV_NAME',{
                rules: [{ required: true, message: '请输入终端名' }]
            })}  style={{ width: 163 }} />
          </FormItem>
          <FormItem
            label="序列号："
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 12 }}>
           <Input placeholder="请输入序列号" {...getFieldProps('DEV_SN',{
               rules: [{ required: true, message: '请输入序列号' }]
           })}  style={{ width: 163 }} />
          </FormItem>
          <FormItem
             label="归属组织： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select id="select" size="large" placeholder="请选择归属组织" {...getFieldProps('ORG_ID',{
                 rules: [{ required: true, message: '请选择归属组织' }]
             })} style={{ width: 163 }}>
               { organizationList }
             </Select>
           </FormItem>
           <FormItem
             label="归属系统： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select id="select" size="large" placeholder="请选择归属系统" {...getFieldProps('DEV_PARENT_ID',{
                 rules: [{ required: true, message: '请选择归属系统' }],
                 initialValue:String(1)
             })} style={{ width: 163 }}>
               { systemList }
             </Select>
           </FormItem>
           <FormItem
             label="终端类型： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select  id="select" size="large" placeholder="请选择终端类型" {...getFieldProps('DVTP_ID',{
                 rules: [{ required: true, message: '请选择终端类型' }],
                 onChange:this.handleDevTypeChange
             })} style={{ width: 163 }}>
               { devTypeList }
             </Select>
           </FormItem>
           <FormItem
             label="终端版本： "
             labelCol={{ span: 8 }}
             wrapperCol={{ span:15 }}>
             <Select id="select" size="large" placeholder="请选择终端版本" {...getFieldProps('DVMD_ID',{
                 rules: [{ required: true, message: '请选择终端版本' }]
             })} style={{ width: 163 }}>
                { versionList }
             </Select>
           </FormItem>

           <FormItem
             label="&nbsp;&nbsp;工作时间： "
             required>
              <TimePicker placeholder="开始时间"  format="HH:mm" {...getFieldProps('DEV_START_TIME',{
                  //rules: [{ required: true, message: '请选择开始时间' }]
              })} />
                  &nbsp;&nbsp;  ~ &nbsp;&nbsp;
              <TimePicker placeholder="结束时间"   format="HH:mm" {...getFieldProps('DEV_END_TIME',{
                  //rules: [{ required: true, message: '请选择结束时间'}]
              })} />
           </FormItem>
           <FormItem
             label="使用状态： ">
             <Select id="select" size="large" placeholder="请选择使用状态" {...getFieldProps('DEV_USE_STATE',{
                 rules: [{ required: true, message: '请选择使用状态' }]
             })} style={{ width: 100 }}>
                { devStatusList }
             </Select>
           </FormItem>
           <br/>
           <FormItem
             label="&nbsp;&nbsp;终端地址： "
             required>
             <Cascader placeholder="请选择终端地址"  options={options} expandTrigger="hover" {...getFieldProps('DEV_POSITION')} style={{ width:410 }}  />
           </FormItem>
           <FormItem
             id="control-textarea"
             label="描述："
             labelCol={{ span: 3 }}
             wrapperCol={{ span: 15}}>
             <Input type="textarea" rows="5" {...getFieldProps('DEV_INFO',{
                 rules: [{max: 124, message: '描述至多为 124 个字符'}]
             })}  style={{ width: 650 }}/>
           </FormItem>
           <FormItem
             label="添加终端数量："
             labelCol={{ span: 8 }}
             wrapperCol={{ span: 12 }}>
             <InputNumber min={1} max={50} placeholder="请输入添加终端数量" {...getFieldProps('ADD_NUM',{
                 initialValue:1
             })} style={{ width: 163 }}/>
           </FormItem>
           <FormItem
             label="终端起始编号："
             labelCol={{ span: 8 }}
             wrapperCol={{ span: 12 }}>
             <InputNumber min={0}  placeholder="请输入终端起始编号" {...getFieldProps('START_NO',{
                 initialValue:1
             })} style={{ width: 163 }}/>
           </FormItem>

       </div>

       <div className={this.state.stepVisible[1]} style={{marginLeft:50}}>
           { paramsHtml }
           <div className="margin-top-10"></div>
       </div>

       <div className={this.state.stepVisible[2]} style={{marginLeft:100}}>
          { moduleHtml }
          <div className="margin-top-10"></div>
       </div>

       <div className={this.state.stepVisible[3]} style={{marginLeft:15}}>
          <FormItem style={{marginLeft:10}} >
            <Transfer
               titles={['可选文件','已配置文件']}
               dataSource={this.state.mockData}
               targetKeys={this.state.targetKeys}
               notFoundContent="暂无"
               render={item => item.title}
               listStyle={{
                   width: 240,
                   height: 300,
               }}
               {...getFieldProps('configFile',{
                 onChange:this.handleConfigFileChange
               })} />
           </FormItem>
           <div className="margin-top-10"></div>
       </div>


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
      Service:{
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
            params=commonFunction.objExtend({},params);
    }
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/device/devlist',
      method: 'POST',
      data:params,
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.data.O_DEVICE.count;
        pagination.current = result.data.O_DEVICE.currentPage;
        devType=result.data.O_DEVICE_TYPE;
        version=result.data.O_DEVICE_VERSION;
        system=result.data.O_SYSTEM;
        organization=result.data.O_ORGANIZATION;
        configFile=result.data.O_DEV_CONFIG;
        this.setState({
          loading: false,
          data: result.data.O_DEVICE.data,
          pagination,
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
      url:web_config.http_request_domain+'/proc/device/devupdate',
      method: 'POST',
      data:editParams,
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.DEV_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(params.DEV_NAME+'，编辑失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/device/devdelete',
      method: 'POST',
      data:deleteParams,
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.DEV_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.DEV_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=commonFunction.objExtend({},data);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/device/devadd',
      method: 'POST',
      data:addParams,
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(addParams.DEV_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(addParams.DEV_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList();
      },
      error:()=>{
        commonFunction.MessageTip(addParams.DEV_NAME+'，添加失败',2,'error');
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

    PubSub.subscribe(PageName+"PeiZhiService",this.handleService);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+'Edit');
    PubSub.unsubscribe(PageName+'Add');
    PubSub.unsubscribe(PageName+'Delete');
    PubSub.unsubscribe(PageName+"PeiZhiService");
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
  handleService(evtName,data){
    PubSub.unsubscribe(PageName+'Edit');
    PubSub.unsubscribe(PageName+'Add');
    PubSub.unsubscribe(PageName+'Delete');
    PubSub.unsubscribe(PageName+"PeiZhiService");
    this.setState({
      Service:{
        visible:true,
        params:data
      }
    });
  },
  render() {

    if(this.state.Service.visible==true){
      return (<Service {...this.state.Service.params}/>)
    }


    const FilterLayerContent= (
      <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    return (
      <div>
       <Row>
        <Col span="4"><SearchInput placeholder="输入设备名搜索" onSearch={this.fetchList} /> </Col>
        <Col span="2" style={{marginLeft:-10}}>
          <Popover placement="bottom" visible={this.state.gaojisousuoVislble} onVisibleChange={this.fliterDisplayChange} overlay={FilterLayerContent} trigger="click">
               <Button type="primary" htmlType="submit" className="gaojibtn el-display-none" >高级搜索</Button> 
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
            rowKey={record => record.DEV_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default Device;
