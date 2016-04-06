import React from 'react';
import  { Table, Icon } from 'antd';
import reqwest from 'reqwest';
import  { Row,Col,Form,Input,Button,QueueAnim } from 'antd';
const FormItem = Form.Item;
const createForm = Form.create;
import './query.less';
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
}];


const App2= React.createClass({
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
    this.fetch(params);
  },
  fetch(params = {}) {
   
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
  render() {
    return (
    <div>
      <br/>
      <Table columns={columns}
        dataSource={this.state.data}
        pagination={this.state.pagination}
        loading={this.state.loading}
        onChange={this.handleTableChange} />
      </div>  
    );
  }
});







export default App2;
