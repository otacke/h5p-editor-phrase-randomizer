import PhraseRandomizerSolutionSelectField from './solution-select-field.js';
import Util from '@services/util.js';

import './solution-selector-array.scss';

/** Class for Solution Select Field */
export default class PhraseRandomizerSolutionSelectorArray {

  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} callbacks Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.callbacks = Util.extend({
      onChanged: () => {},
    }, callbacks);

    this.selectorFields = [];

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-editor-phrase-randomizer-solution-selector-array');
  }

  getDOM() {
    return this.dom;
  }

  getLength() {
    return this.selectorFields.length;
  }

  getLabels() {
    return this.selectorFields.map(((field) => field.getLabel()));
  }

  getSelectedIndex(segmentIndex) {
    return (this.getSolution())[segmentIndex];
  }

  setSelectedIndex(segmentIndex, optionIndex) {
    this.selectorFields[segmentIndex].setSelectedIndex(optionIndex);
  }

  getSolution() {
    return this.selectorFields.map((field) => field.getSelectedIndex());
  }

  updateTitle(index, title) {
    this.selectorFields[index]?.updateTitle(title);
  }

  updateOptions(segmentIndex, options, selectedIndex) {
    this.selectorFields[segmentIndex]?.updateOptions(options, selectedIndex);
  }

  updateOption(segmentIndex, optionIndex, label) {
    this.selectorFields[segmentIndex]?.updateOption(optionIndex, label);
  }

  addField(index) {
    if (index <= this.selectorFields.length - 1) {
      return; // Already have a selector here
    }

    const newField = new PhraseRandomizerSolutionSelectField(
      { id: index },
      {
        onChanged: (data) => {
          this.callbacks.onChanged(data);
        },
      },
    );
    this.selectorFields.push(newField);
    this.dom.append(newField.getDOM());
  }

  removeField(index) {
    const removedField = this.selectorFields.splice(index, 1).shift();
    removedField?.remove(); // Could have been deleted by list
  }

  moveFields(moves) {
    const newFields = [...this.selectorFields];
    moves.forEach((move) => {
      newFields[move.to] = this.selectorFields[move.from];
    });

    this.selectorFields = newFields;

    while (this.dom.firstChild) {
      this.dom.removeChild(this.dom.firstChild);
    }

    this.selectorFields.forEach((field) => {
      this.dom.append(field.getDOM());
    });
  }
}
