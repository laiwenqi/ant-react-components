
import React from 'react';
import { Menu, Icon } from 'antd';
const SubMenu = Menu.SubMenu;

function handleClick(e) {
  console.log('click', e);
}

const MENU= React.createClass({
    getInitialState() {
    return {
      current: '1',
      openKeys: []
    };
  },
  handleClick(e) {
    console.log('click ', e);
    this.setState({
      current: e.key,
      openKeys: e.keyPath.slice(1)
    });
  },
  onToggle(info) {
    this.setState({
      openKeys: info.open ? info.keyPath : info.keyPath.slice(1)
    });
  },
  render() {
    return (
      <Menu onClick={this.handleClick}
        style={{ width: 240 }}
        openKeys={this.state.openKeys}
        onOpen={this.onToggle}
        onClose={this.onToggle}
        selectedKeys={[this.state.current]}
        mode="inline">
        <SubMenu key="sub1" title={<span><Icon type="mail" /><span>表格</span></span>}>
          <Menu.Item key="1"><a href="#/app1">表格1</a></Menu.Item>
          <Menu.Item key="2"><a href="#/app2">表格2</a></Menu.Item>
          <Menu.Item key="3"><a href="#/app3">表格3</a></Menu.Item>
        </SubMenu>
        <SubMenu key="sub2" title={<span><Icon type="appstore" /><span>导航二</span></span>}>
          <Menu.Item key="5">选项5</Menu.Item>
          <Menu.Item key="6">选项6</Menu.Item>
          <SubMenu key="sub3" title="三级导航">
            <Menu.Item key="7">选项7</Menu.Item>
            <Menu.Item key="8">选项8</Menu.Item>
          </SubMenu>
        </SubMenu>
        <SubMenu key="sub4" title={<span><Icon type="setting" /><span>导航三</span></span>}>
          <Menu.Item key="9">选项9</Menu.Item>
          <Menu.Item key="10">选项10</Menu.Item>
          <Menu.Item key="11">选项11</Menu.Item>
          <Menu.Item key="12">选项12</Menu.Item>
        </SubMenu>
      </Menu>
    );
  }
});

export default MENU;
