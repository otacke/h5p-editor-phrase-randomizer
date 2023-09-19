import PhraseRandomizerSolutionSelectorArray from '@components/solution-selector-array.js';

/** Class for PhraseRandomizerSolutionsList H5P widget */
export default class PhraseRandomizerSolutionSelector {

  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;

    // DOM
    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-phrase-randomizer-solution-selector');
    this.$container = H5P.jQuery(this.dom); // jQuery required by H5P core

    this.selectorArray = new PhraseRandomizerSolutionSelectorArray({},
      {
        onChanged: (data) => {
          this.updateSolution(data);
        }
      }
    );
    this.dom.append(this.selectorArray.getDOM());

    // Instantiate original field
    this.fieldInstance = new H5PEditor.widgets[this.field.type](
      this.parent, this.field, this.params, this.setValue
    );

    this.fieldInstance.appendTo(H5P.jQuery(this.dom));
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    this.wrapper = $wrapper.get(0);
    this.wrapper.append(this.$container.get(0));
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    let isValid = this.fieldInstance.validate();
    if (isValid) {
      const solution = this.getSolution().split(',');
      isValid = solution.length === this.selectorArray.getLength() &&
        solution.every((value) => typeof value === 'number' || value >= 0);
    }

    this.wrapper.classList.toggle('error', !isValid);

    return isValid;
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.get(0).remove();
  }

  getLength() {
    return this.selectorArray.getLength();
  }

  getLabels() {
    return this.selectorArray.getLabels();
  }

  /**
   * Get solutionIds, optionally particular index
   * @param {number} [index] Index of solutionIds.
   * @returns {string} SolutionId(s) (of particular index).
   */
  getSolution(index = null) {
    let solution = this.fieldInstance.value ?? '-1';

    if (typeof index !== 'number') {
      return solution;
    }

    solution = solution.split(',');
    while (solution.length < this.selectorArray.getLength()) {
      solution.push('-1');
    }

    return solution[index] ?? '-1';
  }

  setSolution(value) {
    if (Array.isArray(value)) {
      value = value.join(',');
    }

    this.fieldInstance.forceValue(value);

    this.validate();
  }

  updateSolution(data) {
    let currentSolution = this.getSolution()
      .split(',')
      .map((entry) => (entry === '') ? '-1' : entry);

    while (currentSolution.length < this.selectorArray.getLength()) {
      currentSolution.push('-1');
    }

    currentSolution[data.segmentIndex] = `${data.optionIndex}`;

    this.setSolution(currentSolution.join(','));
  }

  updateSelectFieldTitle(index, title) {
    this.selectorArray.updateTitle(index, title);
  }

  updateSelectFieldOptions(params = {}) {
    const currentlySelectedIndex = parseInt(
      this.getSolution(params.segmentIndex) ?? -1
    ) ?? -1;

    let selectedIndex = currentlySelectedIndex;
    if (typeof params.removedOptionIndex === 'number') {
      if (params.removedOptionIndex === currentlySelectedIndex) {
        selectedIndex = -1;
      }
      else if (params.removedOptionIndex < currentlySelectedIndex) {
        selectedIndex = currentlySelectedIndex - 1;
      }
    }
    else if (params.moves) {
      const relevantMove = params.moves.find(
        (move) => move.from === currentlySelectedIndex
      );

      if (relevantMove) {
        selectedIndex = relevantMove.to;
      }
    }
    else {
      selectedIndex = currentlySelectedIndex;
    }

    this.selectorArray.updateOptions(
      params.segmentIndex, params.options, selectedIndex
    );
  }

  updateSelectFieldOption(segmentIndex, optionIndex, label) {
    this.selectorArray.updateOption(segmentIndex, optionIndex, label);
  }

  addSelectField(index) {
    this.selectorArray.addField(index);
  }

  removeSelectField(index) {
    this.selectorArray.removeField(index);
    this.setSolution(this.selectorArray.getSolution());
  }

  moveSelectFields(moved) {
    this.selectorArray.moveFields(moved);
    const solution = this.selectorArray.getSolution();

    // Update solution with new positions
    const solutionClone = [...solution];
    moved.forEach((move) => {
      solution[move.to] = solutionClone[move.from];
    });

    this.setSolution(solution);
  }
}
