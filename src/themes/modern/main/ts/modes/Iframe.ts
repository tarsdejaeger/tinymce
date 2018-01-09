/**
 * Iframe.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2016 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import DOMUtils from 'tinymce/core/dom/DOMUtils';
import Factory from 'tinymce/core/ui/Factory';
import I18n from 'tinymce/core/util/I18n';
import Tools from 'tinymce/core/util/Tools';
import Events from '../api/Events';
import Settings from '../api/Settings';
import A11y from '../ui/A11y';
import ContextToolbars from '../ui/ContextToolbars';
import Menubar from '../ui/Menubar';
import Resize from '../ui/Resize';
import Sidebar from '../ui/Sidebar';
import SkinLoaded from '../ui/SkinLoaded';
import Toolbar from '../ui/Toolbar';

var DOM = DOMUtils.DOM;

var switchMode = function (panel) {
  return function (e) {
    panel.find('*').disabled(e.mode === 'readonly');
  };
};

var editArea = function (border) {
  return {
    type: 'panel',
    name: 'iframe',
    layout: 'stack',
    classes: 'edit-area',
    border: border,
    html: ''
  };
};

var editAreaContainer = function (editor) {
  return {
    type: 'panel',
    layout: 'stack',
    classes: 'edit-aria-container',
    border: '1 0 0 0',
    items: [
      editArea('0'),
      Sidebar.createSidebar(editor)
    ]
  };
};

var render = function (editor, theme, args) {
  var panel, resizeHandleCtrl, startSize;

  if (Settings.isSkinDisabled(editor) === false && args.skinUiCss) {
    DOM.styleSheetLoader.load(args.skinUiCss, SkinLoaded.fireSkinLoaded(editor));
  } else {
    SkinLoaded.fireSkinLoaded(editor)();
  }

  panel = theme.panel = Factory.create({
    type: 'panel',
    role: 'application',
    classes: 'tinymce',
    style: 'visibility: hidden',
    layout: 'stack',
    border: 1,
    items: [
      {
        type: 'container',
        classes: 'top-part',
        items: [
          Settings.hasMenubar(editor) === false ? null : { type: 'menubar', border: '0 0 1 0', items: Menubar.createMenuButtons(editor) },
          Toolbar.createToolbars(editor, Settings.getToolbarSize(editor))
        ]
      },
      Sidebar.hasSidebar(editor) ? editAreaContainer(editor) : editArea('1 0 0 0')
    ]
  });

  if (Settings.getResize(editor) !== "none") {
    resizeHandleCtrl = {
      type: 'resizehandle',
      direction: Settings.getResize(editor),

      onResizeStart: function () {
        var elm = editor.getContentAreaContainer().firstChild;

        startSize = {
          width: elm.clientWidth,
          height: elm.clientHeight
        };
      },

      onResize: function (e) {
        if (Settings.getResize(editor) === 'both') {
          Resize.resizeTo(editor, startSize.width + e.deltaX, startSize.height + e.deltaY);
        } else {
          Resize.resizeTo(editor, null, startSize.height + e.deltaY);
        }
      }
    };
  }

  if (Settings.hasStatusbar(editor)) {
    var linkHtml = '<a href="https://www.tinymce.com/?utm_campaign=editor_referral&utm_medium=poweredby&utm_source=tinymce" rel="noopener" target="_blank">tinymce</a>';
    var html = I18n.translate(['Powered by {0}', linkHtml]);
    var brandingLabel = Settings.isBrandingEnabled(editor) ? { type: 'label', classes: 'branding', html: ' ' + html } : null;

    panel.add({
      type: 'panel', name: 'statusbar', classes: 'statusbar', layout: 'flow', border: '1 0 0 0', ariaRoot: true, items: [
        { type: 'elementpath', editor: editor },
        resizeHandleCtrl,
        brandingLabel
      ]
    });
  }

  Events.fireBeforeRenderUI(editor);
  editor.on('SwitchMode', switchMode(panel));
  panel.renderBefore(args.targetNode).reflow();

  if (Settings.isReadOnly(editor)) {
    editor.setMode('readonly');
  }

  if (args.width) {
    DOM.setStyle(panel.getEl(), 'width', args.width);
  }

  // Remove the panel when the editor is removed
  editor.on('remove', function () {
    panel.remove();
    panel = null;
  });

  // Add accesibility shortcuts
  A11y.addKeys(editor, panel);
  ContextToolbars.addContextualToolbars(editor);

  return {
    iframeContainer: panel.find('#iframe')[0].getEl(),
    editorContainer: panel.getEl()
  };
};

export default <any> {
  render: render
};