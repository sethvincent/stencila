'use strict';

var oo = require('substance-fe0ed/util/oo');
var extend = require('lodash/object/extend');
var Component = require('substance-fe0ed/ui/Component');
var $$ = Component.$$;
var TextProperty = require('substance-fe0ed/ui/TextPropertyComponent');
var StencilNodeComponent = require('../../StencilNodeComponent');
var StencilSourceComponent = require('../../StencilSourceComponent');
var Icon = require('substance-fe0ed/ui/FontAwesomeIcon');

function StencilExecComponent() {
  StencilNodeComponent.apply(this, arguments);
}

StencilExecComponent.Prototype = function() {
  extend(this, StencilSourceComponent.prototype);

  this.render = function() {
    var node = this.props.node;

    var el = $$('div')
      .addClass('stencil-exec')
      .attr("data-id", node.id)
      .attr("contentEditable", false);
    
    if (node.show) {
      this.editorId = Math.random().toString(36).replace(/[^a-z]+/g, '');
      el.append(
        $$('pre')
          .addClass('se-exec-source')
          .attr('id',this.editorId)
          .attr("contentEditable", false)
          .text(node.source)
      );
    } else {
              
      el.append($$(Icon, {icon: 'fa-play'}))
      // Bind click; we need to suppress mouse down, as otherwise
      // Surface will receive events leading to updating the selection
      .on('click', this.onEditSource)
      .on('mousedown', this.onMouseDown);

      if (node.error) {
        el.addClass('stencil-node-error');
      }
    }
   
    return el;
  };

  this.didMount = function() {
    var node = this.props.node;
    if (node.show && window.ace) {
      var editor = this.editor = window.ace.edit(this.editorId);

      var mode = {
        'cila': 'cila',
        'html': 'html',
        'js':   'javascript',
        'py':   'python',
        'r':    'r'           
      }[node.lang] || 'text';
      editor.getSession().setMode('ace/mode/'+mode);
      
      editor.setTheme("ace/theme/monokai");
      editor.setFontSize(13);
      editor.setShowPrintMargin(false);
      // Add padding before first and after last lines
      editor.renderer.setScrollMargin(5,5,0,0);
      // Set the maximum number of lines for the code. When the number
      // of lines exceeds this number a vertical scroll bar appears on the right
      editor.setOption("minLines",1);
      editor.setOption("maxLines",100);
      // Prevent warning message
      editor.$blockScrolling = Infinity;
      // Make readonly as per https://github.com/ajaxorg/ace/issues/266#issuecomment-16367687
      editor.setOptions({
        readOnly: true,
        highlightActiveLine: false,
        highlightGutterLine: false,

        wrap: true,
        indentedSoftWrap: true,
      });
      editor.renderer.$cursorLayer.element.style.opacity = 0;
      editor.textInput.getElement().disabled = true;
      editor.commands.commmandKeyBinding = {};

      editor.setValue(node.source,1);
    }
  };

};

oo.inherit(StencilExecComponent, StencilNodeComponent);

module.exports = StencilExecComponent;
