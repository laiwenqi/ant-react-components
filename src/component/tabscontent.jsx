import React from 'react';
/*import所有用到的页面*/
 import People from '../web/people.jsx';



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
      case "people":
        return (
          <People/>
        )
      break;
    }
  }
});
export default TabsContent;
