import React from 'react';
import { Transfer, Button ,Form} from 'antd';
const FormItem = Form.Item;
const createForm = Form.create;
const App = React.createClass({
  getInitialState() {
    return {
      mockData: [],
      targetKeys: [],
    };
  },
  componentDidMount() {
    this.getMock();
  },
  getMock() {
    let targetKeys = [];
    let mockData = [];
    for (let i = 0; i < 20; i++) {
      const data = {
        key: i,
        title: "dasdas",
        description: "dasdasdasdasas",
        chosen: Math.random() * 2 > 1
      };
      if (data.chosen) {
        targetKeys.push(data.key);
      }
      mockData.push(data);
    }
    this.setState({ mockData, targetKeys });
  },
  handleChange(targetKeys, direction, moveKeys) {
    console.log(targetKeys, direction, moveKeys);
    this.setState({ targetKeys });
  },
  renderFooter() {

    return (
      <Button type="primary" size="small" style={{ float: 'right', margin: '5' }}
        onClick={this.getMock}>
        刷新
      </Button>
    );
  },
  render() {
        console.log(this.state.targetKeys);
    return (
      <Form horizontal form={this.props.form}>
       <FormItem style={{marginLeft:80}}>
         <Transfer
           titles={['权限列表','已有权限']}
           dataSource={this.state.mockData}
           targetKeys={this.state.targetKeys}
           notFoundContent="暂无权限"
           render={item => item.title}
            />
       </FormItem>
      <div className="ant-modal-footer FormItem-modal-footer">
           <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel} >取消</Button>
           <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleSubmit} loading={this.state.loading}>确定</Button>
       </div>
      </Form>

    );
  }
});

export default App;
