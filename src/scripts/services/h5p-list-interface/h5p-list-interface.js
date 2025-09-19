import Util from '@services/util.js';
import OptionsList from './options-list.js';
import SegmentsList from './segments-list.js';

/**
 * @constant {number} WORKAROUND_TIMEOUT_MS Workaround timeout in ms.
 */
const WORKAROUND_TIMEOUT_MS = 1000;

export default class H5PListInterface {

  /**
   * Constructor.
   * @param {H5PEditor.List} list List.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(list, callbacks = {}) {
    if (!(list instanceof H5PEditor.List)) {
      return; // We need a list ...
    }

    this.segmentsList = list;
    this.optionsLists = []; // Could probably have been simpler without this

    this.callbacks = Util.extend({
      onSegmentAdded: () => {},
      onSegmentRemoved: () => {},
      onSegmentMoved: () => {},
      onOptionAdded: () => {},
      onOptionRemoved: () => {},
      onOptionLabelChanged: () => {},
      onTitleChanged: () => {},
    }, callbacks);

    this.segments = new SegmentsList(
      list,
      {
        onSegmentAdded: (data) => {
          this.handleSegmentAdded(data);
        },
        onSegmentRemoved: (data) => {
          this.handleSegmentRemoved(data);
        },
        onSegmentMoved: (data) => {
          this.handleSegmentMoved(data);
        },
        onOptionAdded: (data) => {
          this.handleOptionAdded(data);
        },
        onOptionRemoved: (data) => {
          this.handleOptionRemoved(data);
        },
        onOptionMoved: (data) => {
          this.handleOptionMoved(data);
        },
        onOptionLabelChanged: (data) => {
          this.handleOptionLabelChanged(data);
        },
        onTitleChanged: (title) => {
          this.handleTitleChanged(title);
        },
      },
    );
  }

  /**
   * Reset.
   * @async
   */
  async reset() {
    const wait = new Promise((resolve) => {
      window.setTimeout(() => {
        this.optionsLists = [];
        this.segments.reset();

        this.segmentsList.forEachChild((child) => {
          this.segments.addSegment(child);
        });
        resolve();
      }, WORKAROUND_TIMEOUT_MS); // TODO: Should remain a workaround: Determine what causes the need to stall things
    });

    await wait;
  }

  /**
   * Handle user added a segment with options.
   * @param {object} [data] Data.
   */
  handleSegmentAdded(data = {}) {
    this.optionsLists.push(new OptionsList(data.optionsList));

    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onSegmentAdded(data);
  }

  /**
   * Handle user removed a segment with options.
   * @param {object} [data] Data.
   */
  handleSegmentRemoved(data = {}) {
    this.optionsLists.splice(data.segmentIndex, 1);

    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onSegmentRemoved(data);
  }

  /**
   * Handle user moved a segment.
   * @param {object} [data] Data.
   */
  handleSegmentMoved(data = {}) {
    this.update(data.moved);
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onSegmentMoved(data);
  }

  /**
   * Handle user added an option to a segment.
   * @param {object} [data] Data.
   */
  handleOptionAdded(data = {}) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);

    this.callbacks.onOptionAdded(data);
  }

  /**
   * Handle user removed an option to a segment.
   * @param {object} [data] Data.
   */
  handleOptionRemoved(data = {}) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onOptionRemoved(data);
  }

  /**
   * Handle user removed an option in a segment.
   * @param {object} [data] Data.
   */
  handleOptionMoved(data = {}) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onOptionMoved(data);
  }

  /**
   * Handle user changed the label of an option.
   * @param {object} [data] Data.
   */
  handleOptionLabelChanged(data) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onOptionLabelChanged(data);
  }

  /**
   * Handle user changed the title of a segment.
   * @param {string} title Title of segment.
   */
  handleTitleChanged(title) {
    this.callbacks.onTitleChanged(title);
  }

  /**
   * Update list of segment children if segments have been moved.
   * @param {object} moved Data about moved stuff ({from: number, to: number}[]).
   */
  update(moved) {
    const optionsListsClone = [...this.optionsLists];
    moved.forEach((move) => {
      this.optionsLists[move.to] = optionsListsClone[move.from];
    });
  }

  /**
   * Update options if their position changed in any way.
   */
  updateOptions() {
    this.optionsLists.forEach((optionslist) => {
      optionslist.update();
    });
  }

  /**
   * Get title of particular segment.
   * @param {number} segmentIndex Index of segment.
   * @returns {string} Title of particular segment.
   */
  getSegmentTitle(segmentIndex) {
    let title = null;

    this.segmentsList.forEachChild((child, index) => {
      if (title !== null || index !== segmentIndex) {
        return;
      }

      if (
        !(child instanceof H5PEditor.Group) ||
        child.field?.name !== 'segments'
      ) {
        return;
      }

      const titleInstance = (child.children ?? []).find(
        (child) => child.field?.name === 'title',
      );

      title = titleInstance?.$input?.get(0).value ?? null;
    });

    return title;
  }

  /**
   * Get segment options for particular segment.
   * @param {number} segmentIndex Segment index.
   * @returns {object} Segment options.
   */
  getSegmentOptions(segmentIndex) {
    const options = this.optionsLists[segmentIndex]?.getLabels() ?? [];

    return {
      title: this.getSegmentTitle(segmentIndex),
      options: options.map((label) => ({ label: label })),
    };
  }

  /**
   * Get all information on segments.
   * @returns {object[]} All information on segments.
   */
  getCompleteInformation() {
    const information = [];

    for (let index = 0; index < this.optionsLists.length; index++) {
      information.push({
        title: this.getSegmentTitle(index),
        options: this.getSegmentOptions(index),
      });
    }

    return information;
  }
}
