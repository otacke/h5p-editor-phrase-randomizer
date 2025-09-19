import Util from '@services/util.js';

import './solution-select-field.scss';

/** Class for Solution Select Field */
export default class PhraseRandomizerSolutionSelectField {

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

    this.dom = document.createElement('div');
    this.dom.classList.add(
      'h5p-editor-phrase-randomizer-solution-select-field',
    );

    this.title = document.createElement('div');
    this.title.classList.add(
      'h5p-editor-phrase-randomizer-solution-select-title',
    );
    this.dom.append(this.title);

    this.selectDOM = document.createElement('select');
    this.selectDOM.classList.add(
      'h5p-editor-phrase-randomizer-solution-select-field-select',
    );
    this.selectDOM.selectedIndex = -1;
    this.dom.append(this.selectDOM);

    this.selectDOM.addEventListener('change', () => {
      this.handleChanged();
    });
  }

  getDOM() {
    return this.dom;
  }

  getSelectedIndex() {
    return this.selectDOM.selectedIndex;
  }

  getLabel() {
    return [...this.selectDOM.selectedOptions].shift()?.innerText;
  }

  setSelectedIndex(optionIndex) {
    this.selectDOM.selectedIndex = optionIndex;
    this.selectDOM.dispatchEvent(new Event('change'));
  }

  remove() {
    this.dom.remove();
  }

  updateTitle(title = '') {
    this.title.innerHTML = title;
  }

  updateOptions(newOptions = [], selectedIndex = -1) {
    const options = [...this.selectDOM.querySelectorAll('option')];
    options.forEach((option) => {
      option.remove();
    });

    (newOptions?.options ?? []).forEach((newOption) => {
      const newOptionDOM = document.createElement('option');
      newOptionDOM.setAttribute('value', newOption?.value);
      newOptionDOM.innerText = Util.purifyHTML(newOption?.label);
      this.selectDOM.append(newOptionDOM);
    });

    if (newOptions.title) {
      this.updateTitle(newOptions.title);
    }

    this.setSelectedIndex(selectedIndex ?? -1);
  }

  updateOption(index, label) {
    const options = [...this.selectDOM.querySelectorAll('option')];
    if (!options[index]) {
      return;
    }

    options[index].innerText = Util.purifyHTML(label);
    this.selectDOM.dispatchEvent(new Event('change'));
  }

  handleChanged() {
    this.callbacks.onChanged({
      segmentIndex: this.params.id,
      optionIndex: this.selectDOM.selectedIndex,
    });
  }
}
