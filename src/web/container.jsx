import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { InputNumber,Select,Row,Col,Form,Checkbox,Table,Modal,Input,Popconfirm,Icon,Button,Popover } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;

//页面名称
const PageName='container'+Date.parse(new Date());

//定义组织
let organization=[];

//定义卡箱或钞箱类型
let boxtype=[];

//服务类型
let servicetype=[];

//页面是卡箱还是钞箱？
// 2:卡箱 1：钞箱


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
    const organizationList=organization[this.props.id].map(function(item){
      return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
    });
    const boxtypeList=boxtype[this.props.id].map(function(item){
      return (<Option value={String(item.CTTP_ID)} >{item.CTTP_NAME}</Option>)
    });
    let boxname=(this.props.id==2?"卡箱类型：":"钞箱类型：");
    return (
        <Form inline  onSubmit={this.handleSubmit} >
          <FormItem
            label="归属组织：">
            <Select placeholder="请选择归属组织" style={{ width: 160 }} {...getFieldProps('FILTER_ORG_ID')}>
              { organizationList }
            </Select>
          </FormItem>
          <br/>
          <FormItem
            label={boxname}
            >
            <Select placeholder="请选择类型" style={{ width: 160 }} {...getFieldProps('FILTER_CTTP_ID')}>
              { boxtypeList }
            </Select>
          </FormItem>
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

      let tmsvid;
      for(let i in servicetype[this.props.CTTP_CLASS]){
        if(servicetype[this.props.CTTP_CLASS][i].TMSV_CODE==values.TMSV_CODE){
          tmsvid=String(+servicetype[this.props.CTTP_CLASS][i].TMSV_ID,'0#');
          break;
        }
      }

      let EDIT_PARAMS={
        CTNR_ID:this.state.nochangecontentV.CTNR_ID, //ID
        CTTP_NAME:this.state.nochangecontentV.CTTP_NAME, //名字
        CTNR_CODE:this.state.nochangecontentV.CTNR_CODE, //编号
        TYPE:this.props.CTTP_CLASS+String(+values.CTTP_ID,'0#')+tmsvid
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
     const organizationList=organization[this.props.CTTP_CLASS].map(function(item){
       return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
     });
     const boxtypeList=boxtype[this.props.CTTP_CLASS].map(function(item){
       return (<Option value={String(item.CTTP_ID)} >{item.CTTP_NAME}</Option>)
     });
     const serviceList=servicetype[this.props.CTTP_CLASS].map(function(item){
       return (<Option value={String(item.TMSV_CODE)} >{item.TMSV_NAME}</Option>)
     });
     let boxname=(this.props.CTTP_CLASS==2?"卡箱":"钞箱");
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
      <Form horizontal form={this.props.form}>
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
        label={boxname+"："}
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Select id="select" size="large" placeholder={"请选择"+boxname+"类型"} {...getFieldProps('CTTP_ID',{
            rules: [{ required: true,whitespace:true, message: "请选择"+boxname+"类型" }],
            initialValue:String(this.state.contentV.CTTP_ID)
        })} style={{ width: 163 }}>
        { boxtypeList }
        </Select>
      </FormItem>
      <FormItem
        label={"服务类型："}
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Select id="select" size="large" placeholder={"请选择服务类型"} {...getFieldProps('TMSV_CODE',{
            rules: [{ required: true,whitespace:true, message: "请选择服务类型" }],
            initialValue:String(this.state.contentV.TMSV_CODE)
        })} style={{ width: 163 }}>
        { serviceList }
        </Select>
      </FormItem>
      <FormItem
        label="初始数量："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
      <InputNumber min={0} max={500} placeholder="请输入初始数量" {...getFieldProps('CTNR_INI_COUNT',{
          initialValue:this.state.contentV.CTNR_INI_COUNT || 0
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
      CTNR_ID:this.props.CTNR_ID, //ID
      CTTP_NAME:this.props.CTTP_NAME, //名字
      CTNR_CODE:this.props.CTNR_CODE //编号
    };
    confirm({
      title: '您是否确认要删除'+DELETE_PARAMS.CTTP_NAME+'-'+DELETE_PARAMS.CTNR_CODE,
      content: '',
      onOk() {
        //发布 删除 事件
        PubSub.publish(PageName+"Delete",DELETE_PARAMS);
      },
      onCancel() {}
    });
  },
  render() {
    let op;
    if(this.props.INUSE){
        op=(<div>已使用，不可修改</div>);
      }else{
        op = (
          <div>
            <a type="primary" onClick={this.showModal} {...this.props}>修改</a>
              <span className="ant-divider"></span>
            <a type="primary" onClick={this.handleDelete}>删除</a>
          </div>
          );
    }
    return (
      <div>
        {op}
        <Modal ref="modal"
          width="400"
          visible={this.state.visible}
          title={'修改-'+this.props.CTTP_NAME+'-'+this.props.CTNR_CODE}
          onCancel={this.handleCancel}
          footer={null} >
          <ModalContent
            CTTP_CLASS={this.props.CTTP_CLASS}
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
    let boxname=(this.props.id==2?"添加卡箱":"添加钞箱");
    return (
      <div>
        <Button type="primary" onClick={this.showModal} className="table-add-btn">{boxname}<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={boxname}
          onCancel={this.handleCancel}
          footer={null}>
          <NewAddModalContent
            id={this.props.id}
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
      let tmsvid;
      for(let i in servicetype[this.props.id]){
        if(servicetype[this.props.id][i].TMSV_CODE==params.TMSV_CODE){
          tmsvid=String(+servicetype[this.props.id][i].TMSV_ID,'0#');
          break;
        }
      }

        //编号是 卡箱类型+CTTP_ID+tmsvid
      params.TYPE=this.props.id+String(+params.CTTP_ID,'0#')+tmsvid;

      for(let i in boxtype[this.props.id]){
        if(boxtype[this.props.id][i].CTTP_ID==params.CTTP_ID){
          params.CTTP_NAME=boxtype[this.props.id][i].CTTP_NAME;
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
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     const organizationList=organization[this.props.id].map(function(item){
       return (<Option value={String(item.ORG_ID)} >{item.ORG_NAME}</Option>)
     });
     const boxtypeList=boxtype[this.props.id].map(function(item){
       return (<Option value={String(item.CTTP_ID)} >{item.CTTP_NAME}</Option>)
     });
     const serviceList=servicetype[this.props.id].map(function(item){
       return (<Option value={String(item.TMSV_CODE)} >{item.TMSV_NAME}</Option>)
     });
     let boxname=(this.props.id==2?"卡箱":"钞箱");
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form horizontal form={this.props.form}>
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
         label={boxname+"类型："}
         labelCol={{ span: 8 }}
         wrapperCol={{ span:15 }}>
         <Select id="select" size="large" placeholder={"请选择"+boxname+"类型"} {...getFieldProps('CTTP_ID',{
             rules: [{ required: true,whitespace:true, message: "请选择"+boxname }]
         })} style={{ width: 163 }}>
         { boxtypeList }
         </Select>
       </FormItem>
       <FormItem
         label={"服务类型："}
         labelCol={{ span: 8 }}
         wrapperCol={{ span:15 }}>
         <Select id="select" size="large" placeholder={"请选择服务类型"} {...getFieldProps('TMSV_CODE',{
             rules: [{ required: true,whitespace:true, message: "请选择服务类型" }]
         })} style={{ width: 163 }}>
         { serviceList }
         </Select>
       </FormItem>
       <FormItem
         label="初始数量："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
       <InputNumber min={0} max={500} placeholder="请输入初始数量" {...getFieldProps('CTNR_INI_COUNT',{
           initialValue: 0
       })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="添加数量："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
       <InputNumber min={1} max={50} placeholder="请输入添加数量" {...getFieldProps('BATCH_COUNT',{
           initialValue:1
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
const Container= React.createClass({
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
    params=commonFunction.objExtend(params,{CTTP_CLASS:this.props.id});
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/container/list',
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
        pagination.total = result.data.O_T_CONTAINER.count;
        pagination.current = result.data.O_T_CONTAINER.currentPage;
        organization[this.props.id] = result.data.O_T_ORGANIZATION;
        servicetype[this.props.id] = result.data.O_T_TERM_SERVICE;
        boxtype[this.props.id] = result.data.O_T_CONTAINER_TYPE;
        this.setState({
          loading: false,
          data: result.data.O_T_CONTAINER.data,
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
      url:web_config.http_request_domain+'/proc/container/update',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:editParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0&&commonFunction.MessageTip(editParams.CTTP_NAME+'，编辑成功',2,'success');
        result.data.ERROR!=0&&commonFunction.MessageTip(editParams.CTTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(editParams.CTTP_NAME+'，编辑失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/container/destroy',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:deleteParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(deleteParams.CTTP_NAME+'，删除成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(deleteParams.CTTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(deleteParams.CTTP_NAME+'，删除失败',2,'error');
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
      url:web_config.http_request_domain+'/proc/container/add',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:addParams,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        result.data.ERROR==0 && commonFunction.MessageTip(addParams.CTTP_NAME+'，添加成功',2,'success');
        result.data.ERROR!=0 && commonFunction.MessageTip(addParams.CTTP_NAME+'，'+result.data.MSG,2,'error');
        this.fetchList(listParams);
      },
      error:()=>{
        commonFunction.MessageTip(addParams.CTTP_NAME+'，添加失败',2,'error');
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
  render() {
    const FilterLayerContent= (
      <FilterLayer id={this.props.id} search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    let a=this;
    return (
      <div>
       <Row>
        <Col span="4"><SearchInput placeholder="输入编号搜索" onSearch={this.fetchList} /> </Col>
        <Col span="2" style={{marginLeft:-10}}>
          <Popover placement="bottom" visible={this.state.gaojisousuoVislble} onVisibleChange={this.fliterDisplayChange} overlay={FilterLayerContent} trigger="click">
              <Button type="primary" htmlType="submit" className="gaojibtn" >高级搜索</Button>
          </Popover>
        </Col>
        <Col span="1" style={{marginLeft:-20}}>
              <Button type="primary" htmlType="submit" onClick={this.resetSearch} >重置</Button>
        </Col>
        <Col span="12" className="table-add-layer"><NewAdd id={this.props.id} /></Col>
       </Row>
        <div className="margin-top-10"></div>
            <Table columns={[{
              title: '归属组织',
              dataIndex: 'ORG_NAME'
            },{
              title:this.props.id==2?"卡箱类型":"钞箱类型",
              dataIndex: 'CTTP_NAME'
            },{
              title: '服务类型',
              dataIndex: 'TMSV_NAME'
            },{
              title:this.props.id==2?"卡箱编号":"钞箱编号",
              dataIndex: 'CTNR_CODE'
            },{
              title: '初始数量',
              dataIndex: 'CTNR_INI_COUNT'
            },{
              title: '操作',
              key: 'operation',
              render(text, row, index) {
                return (
                  /* 把所在的行的数据传递下去 */
                  <Edit {...row} />
                  );
                }
            }]}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
            size="middle"
            rowKey={record => record.CTNR_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default Container;
