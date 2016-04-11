import React from 'react';
import { Menu, Icon ,Tabs } from 'antd';

import TabsContent from './tabscontent.jsx';
import './mainbody.less';
const SubMenu = Menu.SubMenu; //下级菜单
const TabPane = Tabs.TabPane; //标签页

/* //顶部头部组件 */
const MAINBODY_HEADER= React.createClass({
  render() {
    return (
      <div id="header-wrapper"></div>
    )
  }
});


/* //主体显示数据区域组件 */
const MAINBODY_CONTENT= React.createClass({
  getInitialState() {
    const tabs_data =[{
      'title':'人员管理',
      'key':1,
      'content':'employee'
    }];
    const panes = tabs_data.map(function(item){
      return (<TabPane tab={item.title} key={item.key}><TabsContent component={item.content}/></TabPane>);
    });
    this.newTabIndex = 0;
    return {
        activeKey: panes[0].key,
        current: '1',
        openKeys: [],
        menu_data: [{
          'key': 'sub1',
          'title': '系统管理',
          'icon': 'laptop',
          'contain': [{
            'name': '人员管理',
            'content':'employee',
            'key': '1'
          },{
            'name': '终端管理',
            'content':'employee',
            'key': '2'
          }]
        },{
          'key': 'sub2',
          'title': '业务操作',
          'icon': 'book',
          'contain': []
        },{
          'key': 'sub3',
          'title': '系统运维',
          'icon': 'hdd',
          'contain': []
        }],
        panes,
      }
    },
    /* //标签页组件部分 */
    onChange(activeKey) {
      this.setState({ activeKey });
    },
    onEdit(targetKey, action) {
      this[action](targetKey);
    },
    add() {
      const panes = this.state.panes;
      const activeKey = `newTab${this.newTabIndex++}`;
      panes.push(<TabPane tab="新建页签" key={activeKey}>新页面内容</TabPane>);
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
    /* //菜单栏组件部分 */
    handleClick(e) {
          let lastIndex;
          let panes = this.state.panes;
          let activeKey = this.state.activeKey;
          let exist_panes=[]; /*已存在的标签的key*/
          panes.forEach((pane, i) => {
              exist_panes.push(pane.key);
          });
          panes.forEach((pane, i) => {
            if(exist_panes.indexOf(e.key)!=-1){
              activeKey=e.key;
              return;
            }
            if (pane.key !== e.key) {
              activeKey = e.key;
              panes.push(<TabPane tab={e.item.props.title} key={e.key}><TabsContent component={e.item.props.content}/></TabPane>);
              exist_panes.push(e.key);
            }
          });
          this.setState({
            current: e.key,
            openKeys:e.keyPath.slice(1),
            panes,
            activeKey
          });
    },
    onToggle(info) {
          this.setState({
            openKeys: info.open ? info.keyPath : info.keyPath.slice(1)
          });
    },
  render() {
    let handlemenuClick=this.handlemenuClick;
    let menu_content,menu_item_content;
    menu_content = this.state.menu_data.map(function (item) {
      menu_item_content=item.contain.map(function (contain_item) {
        return (
          <Menu.Item key={contain_item.key} content={contain_item.content} title={contain_item.name}><div className="mainbody-menu-item">{contain_item.name}</div></Menu.Item>
        )
      });
      return (
        <SubMenu key={ item.key } title={<span><Icon type={ item.icon } /><span>{ item.title }</span></span>} >
             { menu_item_content }
        </SubMenu>
      )
   });
    return (
      <div>
        <div id="content-wrapper">
          <div id="main-body-content">
              <Tabs onChange={this.onChange} activeKey={this.state.activeKey}
                type="editable-card" onEdit={this.onEdit}>
                {this.state.panes}
              </Tabs>
          </div>
        </div>
        <div id="sidebar-wrapper">
          <div id="menu-wrapper">
            <Menu onClick={this.handleClick}
              style={{ width: 240 }} /*菜单宽度*/
              openKeys={this.state.openKeys}
              onOpen={this.onToggle}
              onClose={this.onToggle}
              selectedKeys={[this.state.current]}
              mode="inline" >
            { menu_content }
            </Menu>
          </div>
        </div>
      </div>
    )
  }
});



{/* //左侧菜单组件 */}
const MAINBODY_MENU= React.createClass({
  render() {
    return (
      <div></div>
    )
  }
});

{/* //整个页面主体框架组件 */}
const MAINBODY= React.createClass({
  getInitialState() {
      return {

      }
    },
  render() {
    return (
      <div>
        <MAINBODY_HEADER onClick={this.handleOk}></MAINBODY_HEADER>
        <MAINBODY_CONTENT></MAINBODY_CONTENT>
      </div>
    )
  }
});
export default MAINBODY;
