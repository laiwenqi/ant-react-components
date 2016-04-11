import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { Row,Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm, message,Icon, Button,Dropdown,Menu,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import './employee.less';
const FormItem = Form.Item;
const InputGroup = Input.Group;


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
          <Input placeholder="请输入搜索地址" {...getFieldProps('address', { initialValue: 3 })}/>
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
  dataIndex: 'EMPL_MOBILE',
  sorter: true
},{
  title: '住址',
  dataIndex: 'EMPL_ADDRESS'
},{
  title: '操作',
  key: 'operation',
  render(text, row, index) {
    return (
      <Edit id={row.EMPL_ID}
            address={row.EMPL_ADDRESS}
            name={row.EMPL_NAME}
            mobile={row.EMPL_MOBILE}
      />
      );
    }
}];




function confirm() {
  message.success('成功删除');
}

function cancel() {
  message.error('点击了取消');
}



//表格操作栏
const Edit = React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false
    };
  },
getDefaultProps(){
    return {
      name:"",
      address:"",
      mobile:"",
      id:''
    };
 },
  showModal() {
    this.setState({
      visible: true
    });
  },
  bsubmit() {
    let params=this.props;
    //发布 人员编辑 事件
    PubSub.publish("employeeEdit",params);
  },
  handleCancel() {
    this.setState({ visible: false });
  },
  render() {
    return (
      <div>
        <a type="primary" onClick={this.showModal} {...this.props}>编辑</a>
        <span className="ant-divider" ></span>
        <Popconfirm title="确定要删除这个吗？" onConfirm={confirm} onCancel={cancel}><a type="primary" >删除</a></Popconfirm>
        <span className="ant-divider" ></span>
        <Popconfirm title="确定要重置密码这个吗？" onConfirm={confirm} onCancel={cancel}><a type="primary" >重置密码</a></Popconfirm>

        <Modal ref="modal"
          visible={this.state.visible}
          title={this.props.name} onCancel={this.handleCancel}
          footer={[
            <Button key="back" type="ghost" size="large" onClick={this.handleCancel}>返 回</Button>,
            <Button key="submit" type="primary" size="large" loading={this.state.loading} onClick={this.bsubmit}>
                  提 交
             </Button>
          ]}>
          姓名：<Input  defaultValue={this.props.name} style={{ width: 200 }} /><br/><br/>
          电话：<InputNumber min={1} max={100}  defaultValue={this.props.mobile} /><br/><br/>
          地址：<Input  defaultValue={this.props.address} style={{ width: 200 }}/>
        </Modal>
      </div>
    );
  }
});





//对象合并
const objExtend=function(o,n){
  for(let tem in n){
    if(tem=='type'){break;}
    o[tem]=n[tem];
  }
  return o;
};




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
      <Col span="12" className="employee-add-layer"><Button type="primary" htmlType="submit" className="employee-add-btn">添加人员<Icon type="plus-square" /></Button> </Col>
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
