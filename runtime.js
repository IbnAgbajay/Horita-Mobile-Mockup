/*
 * A small renderer for the mock-up's screens, so they run as a plain web page
 * (GitHub Pages) without the design canvas.
 *
 * Each screen is a template plus a Component class. The template uses:
 *   {{path}}            a value from renderVals()
 *   <sc-if value>       show the children when the value is truthy
 *   <sc-for list as>    repeat the children for each item
 *   onClick / onChange  event handlers from renderVals()
 * Any state change redraws the whole screen.
 */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) {
      Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch);
      if (this._host) this._host.render();
    }
    forceUpdate() { if (this._host) this._host.render(); }
  }

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function lookup(scope, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var v = scope[parts[0]];
    for (var i = 1; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function interp(text, scope) {
    return text.replace(HOLE, function (_, p) {
      var v = lookup(scope, p);
      return v == null ? '' : String(v);
    });
  }

  function renderNodes(nodes, scope, out) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out);
  }

  function renderNode(n, scope, out) {
    if (n.nodeType === 3) { out.push(document.createTextNode(interp(n.nodeValue, scope))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.localName;

    if (tag === 'sc-if') {
      var m = WHOLE.exec(n.getAttribute('value') || '');
      if (m && lookup(scope, m[1])) renderNodes(n.childNodes, scope, out);
      return;
    }
    if (tag === 'sc-for') {
      var lm = WHOLE.exec(n.getAttribute('list') || '');
      var list = lm ? lookup(scope, lm[1]) : null;
      var as = n.getAttribute('as') || 'item';
      (list || []).forEach(function (item, i) {
        var inner = Object.create(scope);
        inner[as] = item;
        inner.$index = i;
        renderNodes(n.childNodes, inner, out);
      });
      return;
    }

    var el = n.namespaceURI === SVG_NS ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    var attrs = n.attributes;
    for (var a = 0; a < attrs.length; a++) {
      var name = attrs[a].name;
      var raw = attrs[a].value;
      if (name.indexOf('hint-') === 0) continue;
      var whole = WHOLE.exec(raw);
      if (name.length > 2 && name.slice(0, 2) === 'on') {
        var fn = whole ? lookup(scope, whole[1]) : null;
        if (typeof fn === 'function') {
          var ev = name.slice(2);
          if (ev === 'change' && (tag === 'input' || tag === 'textarea')) ev = 'input';
          el.addEventListener(ev, fn);
        }
        continue;
      }
      var v = whole ? lookup(scope, whole[1]) : interp(raw, scope);
      if (v === undefined || v === null) continue;
      if (name === 'value' && (tag === 'input' || tag === 'textarea')) el.value = String(v);
      el.setAttribute(name, String(v));
    }
    var kids = [];
    renderNodes(n.childNodes, scope, kids);
    for (var k = 0; k < kids.length; k++) el.appendChild(kids[k]);
    out.push(el);
  }

  /** Draws one screen into container and keeps it up to date. */
  function mount(container, template, scriptText, props) {
    var Component = new Function('DCLogic', scriptText + '\n;return Component;')(DCLogic);
    var comp = new Component(props || {});
    var host = {
      comp: comp,
      render: function () {
        // Keep focus in a text box and the scroll position while on the same screen.
        var active = document.activeElement;
        var focusKey = active && container.contains(active) ? active.getAttribute('aria-label') : null;
        var caret = focusKey && typeof active.selectionStart === 'number' ? active.selectionStart : null;
        var scrolls = [];
        container.querySelectorAll('*').forEach(function (e, i) { if (e.scrollTop > 0) scrolls.push([i, e.scrollTop]); });

        var out = [];
        renderNodes(template.childNodes, comp.renderVals(), out);
        container.replaceChildren.apply(container, out);

        if (comp.state.screen === host.lastScreen) {
          var all = container.querySelectorAll('*');
          scrolls.forEach(function (s) { if (all[s[0]]) all[s[0]].scrollTop = s[1]; });
        }
        host.lastScreen = comp.state.screen;
        if (focusKey) {
          var again = container.querySelector('[aria-label="' + CSS.escape(focusKey) + '"]');
          if (again && again.tagName === 'INPUT') {
            again.focus();
            if (caret !== null) try { again.setSelectionRange(caret, caret); } catch (e) { /* not a text box */ }
          }
        }
      }
    };
    comp._host = host;
    host.render();
    return host;
  }

  window.HoritaMockup = { mount: mount };
})();
