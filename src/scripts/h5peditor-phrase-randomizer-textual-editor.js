import Util from '@services/util.js';
import Dictionary from '@services/dictionary.js';

/** Class for PhraseRandomizerTextualEditor H5P widget */
export default class PhraseRandomizerTextualEditor {
  /**
   * @class
   * @param {H5P.List} list List to be replaced.
   */
  constructor(list) {
    this.list = list;
    this.isRecreatingList = false;

    this.dictionary = new Dictionary();
    this.fillDictionary();

    // Will be used by H5P.List / H5P.SemanticsStructure
    this.helpText = this.buildHelpText();

    // DOM
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(
      'h5p-editor-phrase-randomizer-textual-editor-textarea',
    );
    this.inputField.setAttribute('id', list.getId());
    if (list.getDescriptionId()) {
      this.inputField.setAttribute('aria-describedby', list.getDescriptionId());
    }
    this.inputField.setAttribute(
      'rows', PhraseRandomizerTextualEditor.DEFAULT_ROWS,
    );
    this.inputField.setAttribute(
      'placeholder', this.dictionary.get('l10n.helpTextExampleText'),
    );

    this.inputField.addEventListener('change', () => {
      this.oldSolutions = this.solutionsFieldInstance?.getSolutionIndicators();

      // Solutions will need to be re-created
      this.solutionsFieldInstance?.removeSolutions();

      this.recreateList();

      this.solutionsFieldInstance?.reset(this.oldSolutions);
    });

    this.solutionsFieldInstance = this.list.parent?.children?.find((child) => {
      return child.field.name === 'solutions';
    });
  }

  /**
   * Recreate the list for H5P.List.
   */
  recreateList() {
    // Get text input
    const textLines = this.inputField.value.split('\n');
    textLines.push(''); // Final separator to add last item to list

    this.isRecreatingList = true;

    // Reset list, not using removeAllItems() as this does not trigger events
    const listLength = this.list.getValue().length;
    if (listLength > 0) {
      for (let i = listLength - 1; i >= 0; i--) {
        this.list.removeItem(i);
      }
    }

    let newItem = { options: [] };

    // Parse text area and create list items from text blocks
    textLines.forEach((textline) => {
      textline = textline.trim();

      if (textline === '') {
        if (Object.keys(newItem.options).length === 0) {
          return; // Was obsolete blank line
        }

        this.list.addItem(newItem);
        newItem = { options: [] };

        return;
      }

      // Distinguish between segment options and other parameters
      if (textline.indexOf('title=') === 0) {
        newItem.title = textline.substring('title='.length);
      }
      else if (textline.indexOf('color=') === 0) {
        newItem.colorBackground = Util.getRGBColorCode(
          textline.substring('color='.length),
        ) ?? PhraseRandomizerTextualEditor.DEFAULT_COLOR;
      }
      else {
        newItem.options.push(Util.encodeForHTML(textline));
      }
    });

    this.isRecreatingList = false;
  }

  /**
   * Add item to text field. Called by H5P.List.
   * Will decode parameters into lines for text area.
   * @param {H5PEditor.Group} item Group item.
   */
  addItem(item) {
    if (this.isRecreatingList) {
      return;
    }

    if (!(item instanceof H5PEditor.Group)) {
      return;
    }

    const lineParts = [];

    const labels = Util.findWidgetInstance(item, 'options')?.getValue() ?? [''];
    lineParts.push(
      labels.map((item) => Util.purifyHTML(item)).join('\n'),
    );

    const title = Util.findWidgetInstance(item, 'title')?.value;
    if (title && title !== '') {
      lineParts.push(`title=${title}`);
    }

    const backgroundColor = Util.findWidgetInstance(
      item, 'colorBackground',
    )?.params;
    if (backgroundColor) {
      const backgroundColorDefault = H5PEditor
        .findField('colorBackground', item)
        .field?.default;

      if (backgroundColor !== backgroundColorDefault) {
        lineParts.push(`color=${backgroundColor}`);
      }
    }

    this.inputField.value = (this.inputField.value === '') ?
      lineParts.join('\n') :
      `${this.inputField.value}\n\n${lineParts.join('\n')}`;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    this.wrapper = $wrapper.get(0);

    this.wrapper.append(this.inputField);
    this.wrapper.classList.add(
      'h5p-editor-phrase-randomizer-textual-editor',
    );
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.inputField.remove();
  }

  /**
   * Fill Dictionary.
   */
  fillDictionary() {
    // Convert H5PEditor language strings into object.
    const plainTranslations =
      H5PEditor.language['H5PEditor.PhraseRandomizer']
        .libraryStrings || {};

    // Get l10n from H5P core if available to keep uniform translations
    let translations = this.getH5PCoreL10ns([
      { local: 'helpTextTitleMain', h5pCore: 'importantInstructions' },
      { local: 'helpTextTitleExample', h5pCore: 'example' },
    ]);

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

      // Add translation string if not set already
      current[lastSplit] = current[lastSplit] ?? plainTranslations[key];
    }

    translations = this.sanitizeTranslations(translations);

    this.dictionary.fill(translations, {
      markdownToHTML: ['helpTextIntroduction'],
    });
  }

  /**
   * Get localization defaults from H5P core if possible to keep uniform.
   * @param {object[]} keyPairs containing local key and h5pCore key.
   * @returns {object} Translation object with available l10n from H5P core.
   */
  getH5PCoreL10ns(keyPairs = []) {
    const l10n = {};

    keyPairs.forEach((keys) => {
      if (typeof keys.local !== 'string' || typeof keys.h5pCore !== 'string') {
        return;
      }

      const h5pCoreTranslation = H5PEditor.t('core', keys.h5pCore);
      if (h5pCoreTranslation.indexOf('Missing translation') !== 0) {
        l10n[keys.local] = h5pCoreTranslation;
      }
    });

    return { l10n: l10n };
  }

  /**
   * Sanitize translations with defaults.
   * @param {object} translations Translations.
   * @returns {object} Sanitized translations.
   */
  sanitizeTranslations(translations) {
    return Util.extend({
      l10n: {
        helpTextTitleMain: 'Important instructions',
        helpTextTitleExample: 'Example',
        // eslint-disable-next-line @stylistic/js/max-len
        helpTextIntroduction: 'Create blocks of segments, where each block is separated by an empty line.<br />In each block each line represents an option for the segment.<br />The title can optionally be set by starting the line with <em>title=</em> followed by the title.<br />The optional segment background color can be set by starting the line with <em>color=</em> followed by a color code, e.g. rgb(255, 0, 0) or #ff0000.',
        helpTextExample: 'strawberry\nraspberry\ncloudberry\ntitle=berry name\ncolor=#c69e3b\n\npie\nyoghurt\njam',
      },
    }, translations);
  }

  /**
   * Build help text from different snippets.
   * Will look like important description widget for text fields.
   * @returns {string} HTML string representing help text.
   */
  buildHelpText() {
    // Header
    const title = `<div class="title">${this.dictionary.get('l10n.helpTextTitleMain')}</div>`;
    const header = `<div class="header">${title}</div>`;

    // Body with description and example
    const introductionText = Util.markdownToHTML(
      this.dictionary.get('l10n.helpTextIntroduction'),
      { separateWithBR: true },
    );
    const description = `<div class="description">${introductionText}</div>`;

    const exampleTitle = `<div class="example-title">${this.dictionary.get('l10n.helpTextTitleExample')}</div>`;
    const exampleText = Util.markdownToHTML(
      this.dictionary.get('l10n.helpTextExample'),
      { separateWithBR: true },
    );
    const exampleTextDOM = `<div class="example-text">${exampleText}</div>`;
    const example = `<div class="example">${exampleTitle}${exampleTextDOM}</div>`;

    const body = `<div class="body">${description}${example}</div>`;

    return `${header}${body}`;
  }
}

/** @constant {string} DEFAULT_COLOR Default color for a segment. */
PhraseRandomizerTextualEditor.DEFAULT_COLOR = 'rgb(255,255,255)';

/** @constant {number} DEFAULT_ROWS Number of rows for text area. */
PhraseRandomizerTextualEditor.DEFAULT_ROWS = 20;
