import OptionsListItem from './options-list-item.js';

export default class OptionsList {

  /**
   * @class
   * @param {H5PEditor.List} list List of options.
   */
  constructor(list) {
    this.list = list;

    this.optionItems = [];
    this.listChildren = [];

    this.update();

    this.list.on('addedItem', (event) => {
      if (!(event.data instanceof H5PEditor.Text)) {
        return; // Should always be a "text" field
      }

      this.optionItems.push(new OptionsListItem(event.data));
    });

    this.list.on('removedItem', (event) => {
      this.optionItems.splice(event.data, 1);
    });
  }

  /**
   * Get id.
   * @returns {string} Id as assigned to by H5P core to list for its DOM.
   */
  getId() {
    return this.list.getId();
  }

  /**
   * Get labels.
   * @returns {string[]} Labels of all options.
   */
  getLabels() {
    return this.optionItems.map((option) => option.getLabel()) ?? [];
  }

  getParams() {
    return this.optionItems;
  }

  /**
   * Update internal children with list's current children.
   */
  update() {
    this.optionItems = [];

    this.list.forEachChild((instance) => {
      if (!(instance instanceof H5PEditor.Text)) {
        return; // Should always be a "text" field
      }

      this.optionItems.push(new OptionsListItem(instance));
    });

    this.listChildren = this.getListChildren();
  }

  /**
   * Get list children.
   * Used to determine order changes not signalled by H5P.List. Not using DOM
   * element, because not guaranteed to be identifiable if list widget such as
   * Vertical Tabs is used.
   * @returns {H5PEditor.Group[]} List children.
   */
  getListChildren() {
    const children = [];

    this.list.forEachChild((child) => {
      children.push(child);
    });

    return children;
  }

  /**
   * Get changes in list.
   * @returns {object} Changes as {added: number, removed: number, moved: object[]}.
   */
  getChanges() {
    const currentChildren = this.getListChildren();

    const result = {
      added: -1,
      removed: -1,
      moved: [],
    };

    result.added = (currentChildren.length > this.listChildren.length) ?
      currentChildren.length - 1 :
      -1;

    if (result.added !== -1) {
      return result; // Only one change at a time is possible
    }

    result.removed = (currentChildren.length < this.listChildren.length) ?
      this.listChildren.findIndex((child) => !currentChildren.includes(child)) :
      -1;

    if (result.removed !== -1) {
      return result; // Only one change at a time is possible
    }

    const findIndex = (child) => {
      return currentChildren.findIndex((newChild) => newChild === child);
    };

    result.moved = this.listChildren
      .map((child, index) => ({ from: index, to: findIndex(child) }))
      .filter((move) => (move.from !== move.to));

    return result;
  }

  /**
   * Find option by id.
   * @param {string} id to look for.
   * @returns {OptionsListItem|null} Option or null if not found.
   */
  findOptionById(id) {
    const found = this.optionItems.find((option) => option.getId() === id);
    return (found !== -1) ? found : null;
  }

  /**
   * Determine whether list includes an option item.
   * @param {OptionsListItem} option Option to look for
   * @returns {boolean} true, if list includes option.
   */
  includes(option) {
    return this.optionItems.includes(option);
  }
}
