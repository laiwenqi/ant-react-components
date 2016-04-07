import React from 'react';
import  { Table } from 'antd';
import reqwest from 'reqwest';
import { Modal } from 'antd';
import { InputNumber,Input,Popconfirm, message,Icon, Button,Dropdown,Menu,Popover,Select,Tabs } from 'antd';
import classNames from 'classnames';
import './App.less';
import fff from './query';
const TabPane = Tabs.TabPane;
const InputGroup = Input.Group;


const Demo_TABS = React.createClass({
  getInitialState() {
    this.newTabIndex = 0;
    const panes = [
      <TabPane tab="页签1" key="1"><App/></TabPane>
      ];
    return {
      activeKey: panes[0].key,
      panes,
    };
  },
  onChange(activeKey) {
    this.setState({ activeKey });
  },
  onEdit(targetKey, action) {
    this[action](targetKey);
  },
  add() {
    const panes = this.state.panes;
    const activeKey = `newTab${this.newTabIndex++}`;
    panes.push(<TabPane tab="新建页签" key={activeKey}>新页面</TabPane>);
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
  render() {
    return (
      <Tabs onChange={this.onChange} activeKey={this.state.activeKey}
        type="editable-card" onEdit={this.onEdit}>
        {this.state.panes}
      </Tabs>
    );
  }
});






















const SearchInput = React.createClass({
  getInitialState() {
    return {
        onClick:'',
        value: 'hello',
        name:'',
        focus: false,
    };
  },
  handleChange(e) {
    this.setState({
      value: e.target.value,
    });
  },
  handleInputChange(e) {
    this.setState({
      value: e.target.value,
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
  handleShow2(){
      console.log(this.state.value);
      this.props.woyao(11);
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

const sousuo = (
    <div >
    <p>姓名：<Input id="defaultInput" placeholder="名字"  value={value} onChange={this.handleChange}/></p><br/>
    <p>地址：<Input id="defaultInput" placeholder="地址" /></p><br/>
       <Button  type="ghost" size="small"  onClick={this.handleShow2}>搜索</Button>&nbsp;&nbsp;&nbsp;&nbsp;<Button  type="ghost" size="small" >清空</Button>
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
                <Popover placement="bottom" overlay={sousuo} trigger="click">
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
            <Test
                address={row.address}
                name={row.name}
                age={row.age}
                />
        )  ;
    }
}];


const App= React.createClass({
   getInitialState() {
    return {
      data: [],
      pagination: {},
      loading: false,
    };
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
 //   console.log('请求参数：', params);
    this.setState({ loading: true });
    $.ajax({
      url: 'http://www.lwqiu.com/test/ant/data/data.php',
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
 dianji(value) {
     console.log(value);
  },
  render() {
    return (
    <div>
        <SearchInput className="foo" placeholder="搜索" style={{ width: 200 }} woyao={this.dianji} />
            <br/>
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

export default Demo_TABS;
