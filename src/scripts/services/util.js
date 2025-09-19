import Color from 'color';
import { decode, encode } from 'he';
import showdown from 'showdown';

/** Class for utility functions */
export default class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (
            typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object'
          ) {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Retrieve string without HTML tags.
   * @param {string} html Input string.
   * @returns {string} Output string.
   */
  static stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * HTML decode and strip HTML.
   * @param {string|object} html html.
   * @returns {string} html value.
   */
  static purifyHTML(html) {
    if (typeof html !== 'string') {
      return '';
    }

    return Util.stripHTML(decode(html));
  }

  /**
   * Capitalize text.
   * @param {string} text Text to be capitalized.
   * @returns {string} Capitalized text.
   */
  static capitalize(text = '') {
    return `${(text[0] ?? '').toUpperCase()}${text.slice(1)}`;
  }

  /**
   * Encode text to be printable as HTML.
   * @param {string} text Text.
   * @returns {string} Text encoded for HTML display.
   */
  static encodeForHTML(text) {
    return encode(text);
  }

  static getRGBColorCode(value) {
    let color;

    try {
      color = Color(value);
    }
    catch (error) {
      return false;
    }

    const [red, green, blue] = color.rgb().array();
    return `rgb(${red}, ${green}, ${blue})`;
  }

  /**
   * Find widget instance (in H5P.Group).
   * @param {H5P.Group} parent Parent element.
   * @param {string} instanceFieldName Name of field to look up instance for.
   * @returns {object|boolean} Instance or false.
   */
  static findWidgetInstance(parent = {}, instanceFieldName = '') {
    if (!Array.isArray(parent.children)) {
      return false;
    }

    if (!Array.isArray(parent.field?.fields)) {
      return false;
    }

    const instanceIndex = parent.field.fields.findIndex(
      (child) => child.name === instanceFieldName,
    );

    return (instanceIndex !== -1) ? parent.children[instanceIndex] : false;
  }

  /**
   * Convert markdown to html.
   * @param {string} markdown Markdown text.
   * @param {object} [options] Options.
   * @param {boolean} [options.separateWithBR] True separate parapgraphs with breaks.
   * @returns {string} HTML text.
   */
  static markdownToHTML(markdown, options = {}) {
    const converter = new showdown.Converter();
    let html = converter.makeHtml(markdown);

    if (options.separateWithBR) {
      html = html
        .replace(/<\/p>(\n)?<p>/g, '\n\n')
        .replace(/<(\/)?p>/g, '')
        .replace(/\n/g, '<br />');
    }

    return html;
  }
}
