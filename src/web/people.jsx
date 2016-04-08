import React from 'react';
import reqwest from 'reqwest';
import { Row, Col,Form,Checkbox,Table,Modal,InputNumber,Input,Popconfirm, message,Icon, Button,Dropdown,Menu,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import './people.less';
const FormItem = Form.Item;
const InputGroup = Input.Group;

        /*<SearchInput className="foo" placeholder="搜索" style={{ width: 200 }} handleSearchClick={this.handleSearchClick}></SearchInput>*/
let Demo = React.createClass({
  getInitialState() {
    console.log(this.props.ss);
    return {
      ss:this.props.ss
    };
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.search(this.props.form.getFieldsValue().userName);
    console.log('收到表单值：', this.props.form.getFieldsValue());
  },

  render() {
const { getFieldProps } = this.props.form;
    return (
      <Form horizontal inline onSubmit={this.handleSubmit} className="advanced-search-form advanced-search-o">
    <Row>
      <Col span="8">
        <FormItem
          label="搜索名称："
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}>
          <Input placeholder="请输入搜索名称"   {...getFieldProps('userName')}/>
        </FormItem>
      </Col>
    </Row>
    <Row>
      <Col span="8" offset="16" style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">搜索</Button>
        <Button>清除条件</Button>
      </Col>
    </Row>
  </Form>
    );
  }
});

Demo = Form.create()(Demo);

const filter_content = (
  <div >
    <p>姓名：<Input id="defaultInput" placeholder="名字" /></p><br/>
    <p>地址：<Input id="defaultInput" placeholder="地址" /></p><br/>
  </div>
);

const columns = [{
  title: '姓名',
  dataIndex: 'name',
  filters: [{
    text: '姓李的',
    value: '李'
  }, {
    text: '姓胡的',
    value: '胡'
  }]
}, {
  title: '年龄',
  dataIndex: 'age',
  sorter: true
}, {
  title: '住址',
  dataIndex: 'address'
},{
  title: '操作',
  key: 'operation',
  render(text, row, index) {
    return (
      <Test address={row.address}
            name={row.name}
            age={row.age}
      />
      );
    }
}];

const SearchInput = React.createClass({
  getInitialState() {
    return {
        onClick:'',
        value:'',
        focus: false,
        name:'',
        address:''
    };
  },
  handleChange(e) {
    this.setState({
      value: e.target.value,
    });
  },
  handleInputChange(e) {
    this.setState({
      name: e.target.value,
    });
  },
  handleInputChange2(e) {
    this.setState({
      address: e.target.value,
    });
  },
  handleFocusBlur(e) {
    this.setState({
      focus: e.target === document.activeElement,
    });
  },
  handleSearch() {
    if (this.props.onSearch) {
      this.props.onSearch();
    }
  },
  handleShow2(e){
    e.preventDefault();
   console.log('收到表单值：', this.props.form.getFieldsValue());
      this.props.handleSearchClick(11);
  },
  render() {
    var value=this.state.value;
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.value.trim(),
    });
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    });
 const { getFieldProps } = this.props.form;
const GaoJiSouSuo = (
  <div>
    <div >
          <Form inline onSubmit={this.handleShow2}>
          <FormItem
            label="账户：">
            <Input placeholder="请输入账户名"
              {...getFieldProps('userName')} />
          </FormItem>
          <FormItem
            label="密码：">
            <Input type="password" placeholder="请输入密码"
              {...getFieldProps('password')} />
          </FormItem>
          <Button type="ghost" size="small"  onClick={this.handleShow2}>搜索</Button>&nbsp;&nbsp;&nbsp;&nbsp;<Button type="ghost" size="small" >清空</Button>
    </Form>
</div>
  </div>
);
    return (
      <InputGroup className={searchCls} style={this.props.style}>
        <Input {...this.props}  onChange={this.handleInputChange}
          onFocus={this.handleFocusBlur} onBlur={this.handleFocusBlur} />
          <div className="ant-input-group-wrap">
            <Button className={btnCls} size={this.props.size} onClick={this.handleSearch}>
              <Icon type="search" />
            </Button>
          </div>
          <div className="ant-input-group-wrap">
                <Popover placement="bottom" overlay={GaoJiSouSuo} trigger="click">
                    <a >高级搜索&nbsp;&nbsp;<Icon type="down" /></a>
               </Popover>
          </div>
        </InputGroup>
    );
  }
});



function confirm() {
  message.success('成功删除');
}

function cancel() {
  //message.error('点击了取消');
}


const Test = React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false,
      nima:""
    };
  },
getDefaultProps(){
    return {
      name:"",
      address:"",
      age:""
    };
 },
  showModal() {
    this.setState({
      visible: true
    });
  },
  bsubmit() {
    console.log(this.props)
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ loading: false, visible: false });
      message.success('成功提交');
    }, 1000);
  },
  handleCancel() {
    this.setState({ visible: false });
  },
  render() {
    return (
      <div>
        <a type="primary" onClick={this.showModal} {...this.props}>
          编辑
        </a>
        <span className="ant-divider" ></span>

        <Popconfirm title="确定要删除这个吗？" onConfirm={confirm} onCancel={cancel}>
             <a type="primary" >删除</a>
        </Popconfirm>

        <Modal ref="modal"
          visible={this.state.visible}
          title={this.props.name} onOk={this.handleOk} onCancel={this.handleCancel}
          footer={[
            <Button key="back" type="ghost" size="large" onClick={this.handleCancel}>返 回</Button>,
            <Button key="submit" type="primary" size="large" loading={this.state.loading} onClick={this.bsubmit}>
                    提 交
             </Button>

          ]}>
          姓名：<Input  defaultValue={this.props.name} style={{ width: 200 }}/><br/><br/>
          年龄：<InputNumber min={1} max={100}  defaultValue={this.props.age} /><br/><br/>
          地址：<Input  defaultValue={this.props.address} style={{ width: 200 }}/>
        </Modal>



      </div>
    );
  }
});


const onClick = function (e) {
  console.log( '点击了！');
  console.log(e);
  alert(columns);
};





const People= React.createClass({
   getInitialState() {
    return {
      url: 'http://www.lwqiu.com/test/ant/data/data.php',
      data: [],
      pagination: {},
      loading: false,
      filterClassName:"filter-content-hidden filter-content-layer"
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
  },
  fetch(params = {}) {
    this.setState({ loading: true });
    $.ajax({
      url:this.state.url,
      method: 'get',
      data: '',
      dataType: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.totalCount;
        this.setState({
          loading: false,
          data: result.data,
          pagination,
        });
      }
    });
  },
  componentDidMount() {
    this.fetch();
  },
  search(a){
    console.log(a);
  },
  filterDisplay(){
    /*展示还没加上动画*/
    if(this.state.filterClassName=="filter-content-hidden filter-content-layer"){
      this.setState({
        filterClassName:"filter-content-show filter-content-layer"
      });
    }else{
      this.setState({
        filterClassName:"filter-content-hidden filter-content-layer"
      });
    }
  },
  render() {
    return (
    <div>
        <Button type="primary" htmlType="submit" onClick={this.filterDisplay} >高级搜索</Button>
        <div className={this.state.filterClassName} >
          <Demo search={this.fetch}/>
        </div>
        <div className="margin-top-10"></div>
        <Table columns={columns}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange}
            size="middle"
        />
   </div>
    );
  }
});



export default People;
