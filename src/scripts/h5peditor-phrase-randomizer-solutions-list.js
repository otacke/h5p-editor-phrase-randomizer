import H5PListInterface from '@services/h5p-list-interface/h5p-list-interface.js';
import '@styles/h5peditor-phrase-randomizer-solutions-list.scss';
import PhraseRandomizerSolutionSelector from './h5peditor-phrase-randomizer-solution-selector.js';
import Dictionary from '@services/dictionary.js';
import Util from '@services/util.js';
import ConfirmationDialog from '@components/confirmation-dialog/confirmation-dialog';

/** Class for PhraseRandomizerSolutionsList H5P widget */
export default class PhraseRandomizerSolutionsList {

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

    this.dictionary = new Dictionary();
    this.fillDictionary();

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    // DOM
    this.$container = H5P.jQuery('<div>', {
      class: 'h5peditor-phrase-randomizer-solutions-list'
    });

    // Instantiate original field
    this.fieldInstance = new H5PEditor.widgets[this.field.type](
      this.parent, this.field, this.params, this.setValue
    );
    this.fieldInstance.appendTo(this.$container);

    this.solutionSelectors = this.getSolutionSelectors() ?? [];

    this.segmentList = this.parent.children
      .find((child) => child.getName?.() === 'segments');

    this.listInterface = new H5PListInterface(this.segmentList, {
      onSegmentAdded: (data) => {
        this.handleSegmentAdded(data.segmentIndex, data.options);
      },
      onSegmentRemoved: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.removeSelectField(data.segmentIndex);
        });
      },
      onSegmentMoved: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.moveSelectFields(data.moved);
        });
      },
      onOptionAdded: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.updateSelectFieldOptions({
            segmentIndex: data.segmentIndex,
            options: data.options,
            addedOptionIndex: data.optionIndex
          });
        });
      },
      onOptionRemoved: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.updateSelectFieldOptions({
            segmentIndex: data.segmentIndex,
            options: data.options,
            removedOptionIndex: data.optionIndex
          });
        });
      },
      onOptionMoved: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.updateSelectFieldOptions({
            segmentIndex: data.segmentIndex,
            options: data.options,
            moves: data.moved
          });
        });
      },
      onOptionLabelChanged: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.updateSelectFieldOptions({
            segmentIndex: data.segmentIndex,
            options: data.options
          });
          selector.updateSelectFieldOption(
            data.segmentIndex, data.optionIndex, data.text
          );
        });
      },
      onTitleChanged: (data) => {
        this.solutionSelectors.forEach((selector) => {
          selector.updateSelectFieldTitle(data.segmentIndex, data.title);
        });
      }
    });

    // Relay changes
    if (this.fieldInstance.changes) {
      this.fieldInstance.changes.push(() => {
        this.handleFieldChange();
      });
    }

    this.solutionsListInstance = this.fieldInstance.children?.find?.(
      (field) => field.getName?.() === 'solutions'
    );
    if (this.solutionsListInstance) {
      this.solutionsListInstance.on('addedItem', () => {
        // Update list of selectors
        this.solutionSelectors = this.getSolutionSelectors() ?? [];

        // Add segments ...
        const completeSegmentInfo = this.listInterface.getCompleteInformation();
        completeSegmentInfo.forEach((segmentInfo, segmentIndex) => {
          this.handleSegmentAdded(segmentIndex, segmentInfo.options);
        });

        this.setTitleBarLabels();
      });

      this.solutionsListInstance.on('removedItem', () => {
        this.solutionSelectors = this.getSolutionSelectors() ?? [];
      });
    }

    // Errors (or add your own)
    this.$errors = this.$container.find('.h5p-errors');

    // Confirmation Dialog
    this.confirmationDialog = new ConfirmationDialog({
      instance: this
    });
    this.confirmationDialog.hide();
    document.body.append(this.confirmationDialog.getDOM());
  }

  getSolutionsLength() {
    return this.solutionSelectors.length;
  }

  getSolutionIndicators() {
    return this.solutionSelectors
      .map((selector) => {
        const values = selector.getSolution().split(',');
        const labels = selector.getLabels();

        return values.map((value, index) => {
          return ({
            segmentIndex: index,
            selectedIndex: parseInt(value),
            label: labels[index]
          });
        });
      })
      .filter((entries) => {
        return entries.some((entry) => entry.label !== undefined);
      });
  }

  /**
   * Remove all solutions.
   */
  removeSolutions() {
    const solutionsList = this.fieldInstance.children.find((child) => {
      return child instanceof H5PEditor.List && child.getName() === 'solutions';
    });

    if (!solutionsList) {
      return; // Weird, what's going on?
    }

    const listId = solutionsList.getId();
    const listEditorDOMs = [...this.fieldInstance.$content.get(0).querySelectorAll(
      `#${listId} .h5p-li`
    )];

    solutionsList.removeAllItems();
    /*
     * removeAllItems() does not remove the widget's dom elements, and the
     * widget itself has no interface to be used.
     */
    listEditorDOMs.forEach((listEditorDOM, index) => {
      listEditorDOM.remove();
      this.solutionSelectors.splice(index, 1);
    });
  }

  async reset(oldSolutions) {
    await this.listInterface.reset();

    if (!oldSolutions) {
      return;
    }

    const solutionsWithErrors = [];

    // Try to recreate previous solutions by comparing old labels and new labels
    oldSolutions.forEach((oldSolution, selectorIndex) => {
      this.solutionsListInstance.addItem();

      const completeSegmentInfo = this.listInterface.getCompleteInformation();

      const newSolution = completeSegmentInfo.map((segment, segmentIndex) => {
        return segment.options.options.findIndex((option) => {
          return option.label === oldSolution[segmentIndex].label;
        });
      });

      newSolution.forEach((solutionValue, segmentIndex) => {
        if (
          solutionValue === -1 && oldSolution[segmentIndex].selectedIndex !== -1
        ) {
          solutionsWithErrors.push(oldSolution[segmentIndex]);
        }

        this.solutionSelectors[selectorIndex].selectorArray
          .setSelectedIndex(segmentIndex, solutionValue);
      });
    });

    if (solutionsWithErrors.length) {
      this.showSolutionChangedDialog(solutionsWithErrors);
    }

    this.setTitleBarLabels();
  }

  /**
   * Show solution changed dialog.
   * @param {object} solutionsWithErrors Solutions that threw errors.
   */
  showSolutionChangedDialog(solutionsWithErrors) {
    const errorTexts = solutionsWithErrors.map((error, index) => {
      const solutionText = this.dictionary.get('l10n.solution')
        .replace(/@number/g, index + 1);
      const segmentText = this.dictionary.get('l10n.segment')
        .replace(/@number/g, error.segmentIndex + 1);
      const labelText = Util.purifyHTML(
        this.dictionary.get('l10n.label').replace(/@text/g, error.label)
      );

      return `${solutionText}, ${segmentText}, ${labelText}`;
    });

    const errorList = `<ul>${errorTexts.map((text) => `<li>${text}</li>`).join('')}</ul>`;
    const dialogText = `${this.dictionary.get('l10n.someOptionsNotAssignable')} ${errorList}`;

    this.confirmationDialog.update(
      {
        hideCancel: true,
        headerText: this.dictionary.get('l10n.confirmSolutionChangedHeader'),
        dialogText: dialogText,
        confirmText: this.dictionary.get('l10n.ok')
      }
    );
    this.confirmationDialog.show();
  }

  /**
   * Ready handler.
   * @param {function} ready Ready callback.
   */
  ready(ready) {
    if (!this.passReadies) {
      ready();
      return;
    }

    this.parent.ready(ready);
  }

  getSolutionSelectors() {
    const children = [];

    this.fieldInstance.children.forEach((child) => {
      if (child instanceof H5PEditor.List && child.getName() === 'solutions') {
        child.forEachChild((solution) => {
          if (solution instanceof PhraseRandomizerSolutionSelector) {
            children.push(solution);
          }
        });
      }
    });

    return children;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.$container.get(0));
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.get(0).remove();
  }

  /**
   * Handle change of field.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.params;
    this.changes.forEach((change) => {
      change(this.params);
    });
  }

  handleSegmentAdded(segmentIndex, options = []) {
    this.solutionSelectors.forEach((selector) => {
      if (segmentIndex < selector.getLength()) {
        return; // Already set
      }

      selector.addSelectField(segmentIndex);
      selector.updateSelectFieldOptions({
        segmentIndex: segmentIndex,
        options: options,
        optionIndex: -1
      });
    });

    this.setTitleBarLabels();
  }

  /**
   * Set title bar labels, notthing that H5P core does
   */
  setTitleBarLabels() {
    const titleBarDOMs = [...this.fieldInstance.$content.get(0)
      .querySelectorAll('.list-item-title-bar')];

    const title = (
      this.field.fields?.find?.((field) => field.name === 'solutions')
    )?.entity ?? '';

    titleBarDOMs.forEach((titleBarDOM, index) => {
      let label = titleBarDOM.querySelector('label');
      if (label) {
        label.innerHTML = `${Util.capitalize(title)} ${index + 1}`.trim();
      }
      else {
        label = document.createElement('label');
        label.classList.add('h5peditor-label');
        label.innerHTML = `${Util.capitalize(title)} ${index + 1}`.trim();
        titleBarDOM.append(label);
      }
    });
  }

  /**
   * Fill Dictionary.
   */
  fillDictionary() {
    // Convert H5PEditor language strings into object.
    const plainTranslations =
      H5PEditor.language['H5PEditor.PhraseRandomizer'].libraryStrings || {};
    const translations = {};

    for (const key in plainTranslations) {
      let current = translations;
      // Assume string keys separated by . or / for defining path
      const splits = key.split(/[./]+/);
      const lastSplit = splits.pop();

      // Create nested object structure if necessary
      splits.forEach((split) => {
        if (!current[split]) {
          current[split] = {};
        }
        current = current[split];
      });

      // Add translation string
      current[lastSplit] = plainTranslations[key];
    }

    this.dictionary.fill(translations);
  }
}
