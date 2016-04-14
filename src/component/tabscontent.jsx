import React from 'react';
/*import所有用到的页面*/
 import Employee from '../web/employee.jsx';
 import Test from '../web/test.jsx';

//下面根据标签页面显示内容
const TabsContent= React.createClass({
  getInitialState() {
    return{
      component:this.props.component
    }
  },
  propTypes: {
   component: React.PropTypes.string.isRequired,
  },
  render() {
    switch(this.state.component){
      case "employee":
        return (
          <Employee/>
        )
      break;
      case "test":
        return (
          <Test/>
        )
      break;
    }
  }
});
export default TabsContent;
