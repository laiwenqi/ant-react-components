import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { DatePicker,Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm, message,Icon, Button,Dropdown,Menu,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import './employee.less';
const FormItem = Form.Item;
const InputGroup = Input.Group;
const confirm = Modal.confirm;

//对象合并
const objExtend=function(o,n){
  for(let tem in n){
    if(tem=='type'){break;}
    o[tem]=n[tem];
  }
  return o;
};

//全局提示框
function MessageTip(msg,time,type) {
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
}





//这里是默认简易的搜索
let SearchInput = React.createClass({
  getInitialState() {
    return {
      I_EMPL_KEY: '',
      focus: false,
    };
  },
  handleInputChange(e) {
    this.setState({
      I_EMPL_KEY: e.target.value,
    });
  },
  handleFocusBlur(e) {
    this.setState({
      focus: e.target === document.activeElement,
    });
  },
  handleSearch(e) {
    let params={};
    params.I_EMPL_KEY=this.state.I_EMPL_KEY.trim();
    params.type="default";
    if (this.props.onSearch) {
      this.props.onSearch(params);
    }
  },
  render() {
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.I_EMPL_KEY.trim(),
    });
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    });
    return (
      <InputGroup className={searchCls} style={this.props.style}>
        <Input {...this.props} value={this.state.I_EMPL_KEY} onChange={this.handleInputChange}
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
    params.type='more';
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
          label="输入搜索地址："
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}>
          <Input placeholder="请输入搜索地址" {...getFieldProps('I_EMPL_ADDRESS', { initialValue: ''})}/>
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



//指定表格每列内容
const columns = [{
  title: '姓名',
  dataIndex: 'EMPL_NAME'
},{
  title: '联系电话',
  dataIndex: 'EMPL_MOBILE'
  /* sorter: true */
},{
  title: '住址',
  dataIndex: 'EMPL_ADDRESS'
},{
  title: '操作',
  key: 'operation',
  render(text, row, index) {
    return (
      <Edit id={row.EMPL_ID}
            I_EMPL_ADDRESS={row.EMPL_ADDRESS}
            I_EMPL_NAME={row.EMPL_NAME}
            I_EMPL_MOBILE={row.EMPL_MOBILE}
      />
      );
    }
}];



//点击操作编辑 弹窗内容
let ModalContent =React.createClass({
  getInitialState() {
    return {
      contentV:this.props.contentValue
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
    }
  },
  contentValueChange(){
    //这里是校验表单输入和保存表单输入，必须通过校验才保存
    this.props.contentValueChange(objExtend({id:this.state.contentV.id},this.props.form.getFieldsValue()))
  },
  render() {
     const { getFieldProps } = this.props.form;
     return (
       <Form horizontal>
       <FormItem
         label="姓名："
         labelCol={{ span: 5 }}
         wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入姓名" {...getFieldProps('I_EMPL_NAME',{
            rules: [{validator: this.contentValueChange}],
            initialValue: this.state.contentV.I_EMPL_NAME
        })}/>
        </FormItem>
        <FormItem
          label="电话："
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入电话" {...getFieldProps('I_EMPL_MOBILE',{
            rules: [{validator: this.contentValueChange}],
            initialValue: this.state.contentV.I_EMPL_MOBILE
        })}/>
       </FormItem>
       <FormItem
         label="地址："
         labelCol={{ span: 5 }}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入地址" {...getFieldProps('I_EMPL_ADDRESS',{
           rules: [{validator: this.contentValueChange}],
           initialValue: this.state.contentV.I_EMPL_ADDRESS
       })}/>
      </FormItem>
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
      visible: false,
      contentValue:this.props
    };
  },
 getDefaultProps(){
    return {
      I_EMPL_NAME:"",
      I_EMPL_ADDRESS:"",
      I_EMPL_MOBILE:"",
      id:''
    };
 },
  showModal() {
    this.setState({
      visible: true
    });
  },
  getContentValue(data){
    this.state.contentValue=data;
  },
  handleCancel() {
    this.setState({
      visible: false
    });
  },
  handleSubmit() {
    /*判断弹窗表单值是否有改变，没有就不包存修改*/
    /*！！两个对象长度不等会导致不正确判断*/
    let aProps = Object.getOwnPropertyNames(this.state.contentValue);
    let bProps = Object.getOwnPropertyNames(this.props);
    let hasChanged=0; /*0表示没有改变*/
    if (aProps.length == bProps.length) {
      for (let i = 0; i < aProps.length; i++) {
        let propName = aProps[i];
        if (this.props[propName] != this.state.contentValue[propName]) {
          hasChanged=1;
       }
      }
    }
    if(hasChanged==0){
      this.setState({ visible: false });
      return;
    }
    let params=this.state.contentValue;
    //发布 人员编辑 事件
    PubSub.publish("employeeEdit",params);
  },
  handleDelete() {
    confirm({
      title: '您是否确认要删除这项内容',
      content: '',
      onOk() {
        MessageTip('删除成功',2,'success');
      },
      onCancel() {}
    });
  },
  handleReset() {
    confirm({
      title: '您是否确认要重置这个密码',
      content: '',
      onOk() {
        MessageTip('重置密码成功',2,'success');
      },
      onCancel() {}
    });
  },
  render() {
    return (
      <div>
        <a type="primary" onClick={this.showModal} {...this.props}>编辑</a>
        <span className="ant-divider" ></span>
        <a type="primary" onClick={this.handleDelete}>删除</a>
        <span className="ant-divider" ></span>
        <a type="primary" onClick={this.handleReset}>重置密码</a>
        <Modal ref="modal"
          visible={this.state.visible}
          title={this.props.I_EMPL_NAME}
          onCancel={this.handleCancel}
          onOk={this.handleSubmit}>
          <ModalContent
            contentValueChange={this.getContentValue}
            contentValue={this.state.contentValue}
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
  handleSubmit() {

  },
  handleDeleteSure(){
    MessageTip('删除成功',2,'success');
  },
  handleDeleteCancel(){
    MessageTip('不删除',2,'success');
  },
  handleResetSure(){
    MessageTip('重置密码成功',2,'success');
  },
  handleResetCancel(){
    MessageTip('不重置',2,'success');
  },
  handleCancel() {
    this.setState({
      visible: false
    });
  },
  render() {
    return (
      <div>
        <Button type="primary" onClick={this.showModal} className="employee-add-btn">添加人员<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          visible={this.state.visible}
          title="添加人员"
          onCancel={this.handleCancel}
          onOk={this.handleSubmit}>
          <NewAddModalContent
            visible={this.state.visible}
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
  contentValueChange(){
    //这里是校验表单输入和保存表单输入，必须通过校验才保存
    //this.props.contentValueChange(objExtend({id:this.state.contentV.id},this.props.form.getFieldsValue()))
  },
  render() {
     const { getFieldProps } = this.props.form;
     return (
       <Form inline>
       <FormItem
         label="&nbsp;&nbsp;&nbsp;&nbsp;用户名："
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入用户名" {...getFieldProps('I_OPER_ACCOUNT',{
            rules: [{validator: this.contentValueChange}]
        })} style={{ width: 163 }} />
        </FormItem>
        <FormItem
          label="员工姓名："
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入姓名" {...getFieldProps('I_EMPL_NAME',{
            rules: [{validator: this.contentValueChange}]
        })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="员工工号："
         labelCol={{ span: 8}}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入员工工号" {...getFieldProps('I_EMPL_CODE',{
           rules: [{validator: this.contentValueChange}]
       })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="身份卡号： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Input placeholder="请输入身份卡号" {...getFieldProps('I_EMPL_CARD_CODE',{
            rules: [{validator: this.contentValueChange}]
        })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="归属组织： "
        labelCol={{ span: 8 }}
        wrapperCol={{ span:15 }}>
        <Select id="select" size="large" placeholder="请选择归属组织" {...getFieldProps('I_ORG_ID',{
            rules: [{validator: this.contentValueChange}]
        })} style={{ width: 163 }}>
          <Option value="0">珠海公交公司</Option>
          <Option value="1">南屏公交公司</Option>
        </Select>
      </FormItem>
      <FormItem
        label="角色分配："
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 12 }}>
        <Select id="select" size="large" placeholder="请选择角色" {...getFieldProps('I_ROLE_ID',{
            rules: [{validator: this.contentValueChange}]
        })} style={{ width: 163 }}>
          <Option value="0">系统操作员</Option>
          <Option value="1">操作员</Option>
        </Select>
     </FormItem>
     <FormItem
       label="终端授权： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:15 }}>
       <Select id="select" size="large" placeholder="请选择是否授权" {...getFieldProps('I_OPER_TERM_IF_AUTH',{
           rules: [{validator: this.contentValueChange}]
       })} style={{ width: 163 }}>
         <Option value="0">否</Option>
         <Option value="1">是</Option>
       </Select>
     </FormItem>
     <FormItem
       label="员工性别： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:12 }}>
       <Select id="select" size="large" placeholder="请选择性别"  {...getFieldProps('I_EMPL_SEX',{
           rules: [{validator: this.contentValueChange}]
       })} style={{ width: 163 }}>
         <Option value="1">男</Option>
         <Option value="0">女</Option>
       </Select>
     </FormItem>
     <FormItem
       label="出生日期： "
       labelCol={{ span: 8 }}
       wrapperCol={{ span:12 }}>
       <DatePicker {...getFieldProps('I_EMPL_BIRTHDAY',{
           rules: [{validator: this.contentValueChange}]
       })} style={{ width: 163 }} />
     </FormItem>
     <FormItem
       label="电子邮箱："
       labelCol={{ span: 8}}
       wrapperCol={{ span: 12 }}>
     <Input placeholder="请输入电子邮箱" {...getFieldProps('I_EMPL_EMAIL',{
         rules: [{validator: this.contentValueChange}]
     })} style={{ width: 163 }}/>
      </FormItem>
      <FormItem
        label="手机号码："
        labelCol={{ span: 8}}
        wrapperCol={{ span: 12 }}>
      <Input placeholder="请输入手机号码" {...getFieldProps('I_EMPL_MOBILE',{
          rules: [{validator: this.contentValueChange}]
      })} style={{ width: 163 }}/>
       </FormItem>
       <FormItem
         label="办公电话："
         labelCol={{ span: 8}}
         wrapperCol={{ span: 12 }}>
       <Input placeholder="请输入办公电话" {...getFieldProps('I_EMPL_OFFICE_PHONE',{
           rules: [{validator: this.contentValueChange}]
       })} style={{ width: 163 }}/>
        </FormItem>
        <FormItem
          label="住址："
          labelCol={{ span:4}}
          wrapperCol={{ span: 12 }}>
        <Input placeholder="请输入" {...getFieldProps('I_EMPL_ADDRESS',{
            rules: [{validator: this.contentValueChange}]
        })} style={{ width: 405 }} />
         </FormItem>
       </Form>
     )
   }
});
NewAddModalContent = Form.create()(NewAddModalContent);




//标签分页里面的整个内容
const Employee= React.createClass({
   getInitialState() {
    return {
      defaultFilter:{},
      moreFilter:{},
      onchangeFilter:{},
      data: [],
      pagination: {
        pageSize:10 //每页显示数目
      },
      loading: false,
      filterClassName:"filter-content-hidden filter-content-layer",//默认隐藏高级
      icontype:'down' //默认高级搜素图标
    };
  },
  handleSearchClick(){

  },
  handleTableChange(pagination, filters, sorter) {
    const pager = this.state.pagination;
    pager.current = pagination.current;
    this.setState({
      pagination: pager
    });
    const params = {
      type:'onchange',
      pageSize: pagination.pageSize,
      currentPage: pagination.current,
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
    if(params.type!='undefined'){
      if(params.type=='more'){
        this.state.moreFilter=params;
        params=objExtend(params,this.state.defaultFilter);
        params=objExtend(params,this.state.onchangeFilter);
      }
      if(params.type=='default'){
        this.state.defaultFilter=params;
        params=objExtend(params,this.state.moreFilter);
        params=objExtend(params,this.state.onchangeFilter);
      }
      if(params.type=='onchange'){
        this.state.onchangeFilter=params;
        params=objExtend(params,this.state.moreFilter);
        params=objExtend(params,this.state.defaultFilter);
      }
    };
    params.I_SIZE=this.state.pagination.pageSize;
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/employee/list',
      method: 'POST',
      data:params,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.data.count;
        pagination.pageSize = 10;
        pagination.current = result.data.currentPage;
        this.setState({
          loading: false,
          data: result.data.O_T_EMPLOYEE.data,
          pagination,
        });
      }
    });
  },
  fetchEdit(evtName,data){
    let params=objExtend({},data);
    if(params.type!='undefined'){
      if(params.type=='more'){
        this.state.moreFilter=params;
        params=objExtend(params,this.state.defaultFilter);
        params=objExtend(params,this.state.onchangeFilter);
      }
      if(params.type=='default'){
        this.state.defaultFilter=params;
        params=objExtend(params,this.state.moreFilter);
        params=objExtend(params,this.state.onchangeFilter);
      }
      if(params.type=='onchange'){
        this.state.onchangeFilter=params;
        params=objExtend(params,this.state.moreFilter);
        params=objExtend(params,this.state.defaultFilter);
      }
    };
    params.I_SIZE=this.state.pagination.pageSize;
    params.I_ROLE_ID=3;
    params.I_EMPL_ID=3;
    params.I_ORG_ID=3;
    params.I_EMPL_CODE=20160307001;
    params.I_EMPL_CARD_CODE=55555555;
    this.setState({ loading: true });
    reqwest({
      url:'http://192.168.6.143:60005/proc/employee/update',
      method: 'POST',
      data:params,
      crossOrigin: true, //跨域
      type: "json",
      success: (result) => {
        MessageTip('成功编辑！！！！！！！',2,'success');
        this.fetchList();
      }
    });
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 人员编辑 的事件
    PubSub.subscribe("employeeEdit",this.fetchEdit);
    // 订阅 人员新增 的事件
    PubSub.subscribe("employeeAdd",this.fetchAdd);
    // 订阅 人员删除 的事件
    PubSub.subscribe("employeeDelete",this.fetchDelete);
    // 订阅 重置密码 的事件
    PubSub.subscribe("employeeResetPassword",this.fetchResetPassword);
  },
  filterDisplay(){
    /*展示还没加上动画*/
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
      <Col span="4"><SearchInput placeholder="输入名字搜索" onSearch={this.fetchList} /> </Col>
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



export default Employee;
