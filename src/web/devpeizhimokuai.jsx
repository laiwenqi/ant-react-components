import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { QueueAnim,Breadcrumb,InputNumber,Select,Row,Col,Form,Checkbox,Table,Modal,Input,Popconfirm,Icon,Button,Popover } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import DevModel from '../web/devmodel.jsx';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;
const Option = Select.Option;
//页面名称
const PageName='devpeizhimokuai'+Date.parse(new Date());

//定义配选类型
const devpeixuantype=[
  { text: '标配', value:'1'},
  { text: '标配兼容', value:'2'},
  { text: '选配', value:'3'},
  { text: '选配兼容', value:'4'}];

  //配选类型下拉列表
const devpeixuantypeList=devpeixuantype.map(function(item){
    return (<Option value={String(item.value)} >{item.text}</Option>)
});


//定义模块
let devmokuai;

//定义配件
let devpeijian;

//指定表格每列内容
const columns = [{
  title: '模块名',
  dataIndex: 'DVML_NAME'
},{
  title: '通道数',
  dataIndex: 'DVML_CHANNEL_NUM'
},{
  title: '配选类型',
  dataIndex: 'DVML_TYPE',
  render(text, row, index) {
    for(let i in devpeixuantype){
        if(devpeixuantype[i].value==row.DVML_TYPE){
          return devpeixuantype[i].text;
          break;
        }
    }
  }
},{
  title: '可选配件',
  dataIndex: 'DVFT_NAME'
},{
  title: '描述',
  dataIndex: 'DVML_DESC'
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
        <Form inline  onSubmit={this.handleSubmit} >

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
      contentV:this.props.contentValue,
      peijianType:([2,4].indexOf(this.props.contentValue.DVML_TYPE)>-1?true:false),
      fittingslist:[]
    }
  },
  componentDidMount() {
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/fittingslist',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:{MDDF_ID:this.props.contentValue.DVML_NO},
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          return;
        }
        this.setState({
          fittingslist: result.data.T_DEVICE_FITTINGS
        });
      },
      error:()=>{
        commonFunction.MessageTip('获取配件选项数据失败',2,'error');
      }
    });

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
        console.log(errors);
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
         DVML_ID:this.state.nochangecontentV.DVML_ID, //需要的ID
         DVML_NAME:this.state.nochangecontentV.DVML_NAME //需要的名字
      };
      let params=commonFunction.objExtend(EDIT_PARAMS,values);
      //发布 编辑 事件
      params.DVFT_ID=JSON.stringify(params.DVFT_ID);
      for(let i in devmokuai){
        if(devmokuai[i].MDDF_ID==params.MDDF_ID){
          params.DVML_NAME=devmokuai[i].MDDF_NAME;
          params.DVML_NO=devmokuai[i].MDDF_NO;
          break;
        }
      }

      this.state.loading=true;
      this.props.modalClose();
      PubSub.publish(PageName+"Edit",params);
    });
  },
  handleCancel() {
    this.props.modalClose();
  },
  handleSelectPeiXuanType(value){

    /* 这里需要改 */
    let contentVChange;
    contentVChange=commonFunction.objExtend({},this.state.contentV);
    contentVChange.DVFT_ID=[''];
    /* 这里需要改 */

    this.setState({
      contentV:contentVChange,
      peijianType:(['2','4'].indexOf(value)>-1?true:false)
    });


  },
  handleSelectMoKuai(value){
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/fittingslist',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:{MDDF_ID:value},
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          return;
        }

        /* 这里需要改 */
        let contentVChange;
        contentVChange=commonFunction.objExtend({},this.state.contentV);
        contentVChange.DVFT_ID=['']
        /* 这里需要改 */

        this.setState({
          contentV:contentVChange,
          fittingslist: result.data.T_DEVICE_FITTINGS
        });

      },
      error:()=>{
        commonFunction.MessageTip('获取配件选项数据失败',2,'error');
      }
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
  render() {
      let fittingsList = [];
      let peijianComponent;
      let peijianType=this.state.peijianType;
      const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
      const devmokuaiList=devmokuai.map(function(item){
        return (<Option value={String(item.MDDF_ID)} >{item.MDDF_NAME}</Option>)
      });
      fittingsList=this.state.fittingslist.map(function(item){
        return (<Option value={String(item.DVFT_ID)} >{item.DVFT_NAME}</Option>)
      });

      for(let i=0;i<this.state.contentV.DVFT_ID.length;i++){
            this.state.contentV.DVFT_ID[i]=String(this.state.contentV.DVFT_ID[i]);
      }



      if(peijianType==true){
          peijianComponent = (
                <FormItem label="配件：">
                  <Select multiple={true} size="large"  placeholder="请选择配件" {...getFieldProps('DVFT_ID',{
                      rules: [{ required: true, message: '请选择配件',type:'array' }],
                      initialValue:this.state.contentV.DVFT_ID
                  })} style={{ width: 400 }}>
                   { fittingsList }
                  </Select>
                </FormItem>
           );
       }else{
         peijianComponent = (
            <FormItem label="配件：">
              <Select multiple={false} size="large"  placeholder="请选择配件" {...getFieldProps('DVFT_ID',{
                  rules: [{ required: true, message: '请选择配件' }],
                  initialValue:this.state.contentV.DVFT_ID[0]
              })} style={{ width: 400 }}>
               { fittingsList }
              </Select>
            </FormItem>
          );
       }
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
         <FormItem label="模块：">
           <Select id="select" size="large" placeholder="请选择模块" {...getFieldProps('MDDF_ID',{
               rules: [{ required: true, message: '请选择模块' }],
               initialValue:String(this.state.contentV.DVML_NO),
               onChange:this.handleSelectMoKuai
           })} style={{ width: 163 }}>
           { devmokuaiList }
           </Select>
         </FormItem>
         <FormItem label="配选类型：">
           <Select id="select" size="large"  placeholder="请选择配选类型" {...getFieldProps('DVML_TYPE',{
               rules: [{ required: true, message: '请选择配选类型' }],
               initialValue:String(this.state.contentV.DVML_TYPE),
               onChange:this.handleSelectPeiXuanType
           })} style={{ width: 163 }}>
           { devpeixuantypeList }
           </Select>
         </FormItem>
         { peijianComponent }
         <FormItem label="通道数：">
           <InputNumber min={0}  placeholder="请填写通道数" {...getFieldProps('DVML_CHANNEL_NUM',{
               initialValue:this.state.contentV.DVML_CHANNEL_NUM
           })} style={{ width: 163 }}>
           </InputNumber>
         </FormItem>
         <FormItem
           id="control-textarea"
           label="&nbsp;&nbsp;&nbsp;&nbsp;描述：">
           <Input type="textarea" rows="5" {...getFieldProps('DVML_DESC',{
               rules: [{max: 128, message: '描述至多为 128 个字符'}],
               initialValue:this.state.contentV.DVML_DESC
           })}   style={{ width: 400 }}/>
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
      DVML_ID:this.props.DVML_ID, //需要删除的ID
      DVML_NAME:this.props.DVML_NAME //需要删除的名字
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.DVML_NAME,
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
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={'修改-'+this.props.DVML_NAME}
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
        <Button type="primary" onClick={this.showModal} className="table-add-btn">添加模块<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title="添加模块"
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
      peijianType:false,
      fittingslist:[]
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
      params.DVFT_ID=JSON.stringify(params.DVFT_ID);
      for(let i in devmokuai){
        if(devmokuai[i].MDDF_ID==params.MDDF_ID){
          params.DVML_NAME=devmokuai[i].MDDF_NAME;
          params.DVML_NO=devmokuai[i].MDDF_NO;
          break;
        }
      }
      //发布 新增 事件
      PubSub.publish(PageName+"Add",params);
      this.props.modalClose();
    });
  },
  handleCancel(){
    this.props.modalClose();
  },
  handleSelectPeiXuanType(value){
    /* 这里需要改 */
    let contentVChange;
    contentVChange=commonFunction.objExtend({},this.state.contentV);
    contentVChange.DVFT_ID=[''];
    /* 这里需要改 */

    this.setState({
      contentV:contentVChange,
      peijianType:(['2','4'].indexOf(value)>-1?true:false)
    });

  },
  handleSelectMoKuai(value){
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/fittingslist',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:{MDDF_ID:value},
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          return;
        }

        /* 这里需要改 */
        let contentVChange;
        contentVChange=commonFunction.objExtend({},this.state.contentV);
        contentVChange.DVFT_ID=['']
        /* 这里需要改 */

        this.setState({
          contentV:contentVChange,
          fittingslist: result.data.T_DEVICE_FITTINGS
        });

      },
      error:()=>{
        commonFunction.MessageTip('获取配件选项数据失败',2,'error');
      }
    });
  },
  render() {
     let fittingsList = [];
     let peijianComponent;
     let peijianType=this.state.peijianType;
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     const devmokuaiList=devmokuai.map(function(item){
       return (<Option value={String(item.MDDF_ID)} >{item.MDDF_NAME}</Option>)
     });
     fittingsList=this.state.fittingslist.map(function(item){
       return (<Option value={String(item.DVFT_ID)} >{item.DVFT_NAME}</Option>)
     });
     if(peijianType==true){
         peijianComponent = (
               <FormItem label="配件：">
                 <Select multiple={true} size="large"  placeholder="请选择配件" {...getFieldProps('DVFT_ID',{
                     rules: [{ required: true, message: '请选择配件',type:'array' }]
                 })} style={{ width: 400 }}>
                  { fittingsList }
                 </Select>
               </FormItem>
          );
      }else{
        peijianComponent = (
           <FormItem label="配件：">
             <Select multiple={false} size="large"  placeholder="请选择配件" {...getFieldProps('DVFT_ID',{
                 rules: [{ required: true, message: '请选择配件' }]
             })} style={{ width: 400 }}>
              { fittingsList }
             </Select>
           </FormItem>
         );
      }
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       /* 配件下拉 列表 动态加载！*/
       <Form inline form={this.props.form}>
       <FormItem label="模块：">
         <Select id="select" size="large" placeholder="请选择模块" {...getFieldProps('MDDF_ID',{
             rules: [{ required: true, message: '请选择模块' }],
             onChange:this.handleSelectMoKuai
         })} style={{ width: 163 }}>
         { devmokuaiList }
         </Select>
       </FormItem>
       <FormItem label="配选类型：">
         <Select id="select" size="large"  placeholder="请选择配选类型" {...getFieldProps('DVML_TYPE',{
             rules: [{ required: true, message: '请选择配选类型' }],
             onChange:this.handleSelectPeiXuanType
         })} style={{ width: 163 }}>
         { devpeixuantypeList }
         </Select>
       </FormItem>
       { peijianComponent }
       <FormItem label="通道数：">
         <InputNumber min={0}  placeholder="请填写通道数" {...getFieldProps('DVML_CHANNEL_NUM',{
             initialValue:0
         })} style={{ width: 163 }}>
         </InputNumber>
       </FormItem>
       <FormItem
         id="control-textarea"
         label="&nbsp;&nbsp;&nbsp;&nbsp;描述：">
         <Input type="textarea" rows="5" {...getFieldProps('DVML_DESC',{
             rules: [{max: 128, message: '描述至多为 128 个字符'}]
         })}   style={{ width: 400 }}/>
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
const DeviceFittings= React.createClass({
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
       Return:{
         visible:false
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
    params=commonFunction.objExtend(params,this.props);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/modulelist',
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
        pagination.total = result.data.O_DEVICE_MODULE.count;
        pagination.current = result.data.O_DEVICE_MODULE.currentPage;
        devmokuai=result.data.O_MODULE_DEFINE;
        this.setState({
          loading: false,
          data: result.data.O_DEVICE_MODULE.data,
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
    console.log(evtName);
    let editParams=commonFunction.objExtend({},data);
    let listParams=commonFunction.objExtend({},this.state.defaultFilter);
    listParams=commonFunction.objExtend(listParams,this.state.moreFilter);
    listParams=commonFunction.objExtend(listParams,this.state.pagination);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/moduleupdate',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.DVML_NAME+'，修改成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.DVML_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(editParams.DVML_NAME+'，修改失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/devmodel/moduledelete',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:deleteParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.DVML_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.DVML_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.DVML_NAME+'，删除失败',2,'error');
        this.fetchList(listParams);
      }
    });
  },
  fetchAdd(evtName,data){
    let addParams=commonFunction.objExtend(data,this.props);
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/devmodel/moduleadd',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:addParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(this.props.DVTP_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(this.props.DVTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList();
      },
      error:()=>{
        commonFunction.MessageTip(this.props.DVML_NAME+'，添加失败',2,'error');
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
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(PageName+'Edit');
    PubSub.unsubscribe(PageName+'Add');
    PubSub.unsubscribe(PageName+'Delete');
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
  handleRetrun(){
    /* 暂时在这里退订，但是组件还没有销毁 */
    PubSub.unsubscribe(PageName+'Edit');
    PubSub.unsubscribe(PageName+'Add');
    PubSub.unsubscribe(PageName+'Delete');

    this.setState({
      Return:{
        visible:true
      }
    });
  },
  render() {
    if(this.state.Return.visible==true){
      return (
        <DevModel/>
      );
    }
    const FilterLayerContent= (
      <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    return (
      <div>
      <QueueAnim duration={[700,700]}>
      <div key="div1">
           <Row>
            <Col span="5"><span className="peizhimokuai-title"> {this.props.DVTP_NAME} - {this.props.DVMD_VER} - 模块列表</span></Col>
            <Col span="3"><div onClick={this.handleRetrun} className="tip-button"><span className="icon-toinstlist"></span>返回终端型号版本列表</div></Col>
            <Col span="12" className="table-add-layer"><NewAdd/></Col>
           </Row>
       </div>
        <div className="margin-top-10"></div>
        <div key="div2">
            <Table columns={columns}
                dataSource={this.state.data}
                pagination={this.state.pagination}
                loading={this.state.loading}
                onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
                size="middle"
                rowKey={record => record.DVML_ID} /*指定每行的主键 不指定默认key*/
                bordered={true}
            />
        </div>
        </QueueAnim>
   </div>
    );
  }
});



export default DeviceFittings;
