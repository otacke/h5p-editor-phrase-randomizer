export default class OptionsListItem {

  /**
   * @class
   * @param {H5PEditor.Text} textInstance Text input field instance.
   */
  constructor(textInstance) {
    this.instance = textInstance;
  }

  /**
   * Get id.
   * @returns {string} Id assigned by H5P Core for DOM element of input field.
   */
  getId() {
    return this.instance.$input.get(0).getAttribute('id');
  }

  /**
   * Get option label.
   * @returns {string} Option label.
   */
  getLabel() {
    return this.instance.value;
  }

  /**
   * Get index of option in its list.
   * @returns {number} Index of option in its list or -1.
   */
  getIndex() {
    const domListItem = this.instance.$input.get(0).closest('li');
    if (!domListItem) {
      return -1;
    }

    const domList = domListItem.closest('ul, ol');
    if (!domList) {
      return -1;
    }

    return [...domList.querySelectorAll('li')]
      .findIndex((element) => element === domListItem);
  }
}
