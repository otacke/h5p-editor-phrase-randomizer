import Util from '@services/util.js';
import OptionsList from './options-list.js';
import SegmentsList from './segments-list.js';

export default class H5PListInterface {

  constructor(list, callbacks = {}) {
    if (!(list instanceof H5PEditor.List)) {
      return; // We need a list ...
    }

    /*
     * TODO: Clean up
     */
    this.segmentsList = list;
    this.optionsLists = [];

    this.callbacks = Util.extend({
      onSegmentAdded: () => {},
      onSegmentRemoved: () => {},
      onSegmentMoved: () => {},
      onOptionAdded: () => {},
      onOptionRemoved: () => {},
      onOptionLabelChanged: () => {},
      onTitleChanged: () => {}
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
        }
      }
    );
  }

  async reset() {
    const wait = new Promise((resolve) => {
      window.setTimeout(() => {
        this.optionsLists = [];
        this.segments.reset();

        this.segmentsList.forEachChild((child) => {
          this.segments.addSegment(child); // TODO: Reset selection index
        });
        resolve();
      }, 1000); // TODO: This is only a workaround (!)
    });

    await wait;
  }

  handleSegmentAdded(data = {}) {
    this.optionsLists.push(new OptionsList(data.optionsList));

    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onSegmentAdded(data);
  }

  handleSegmentRemoved(data = {}) {
    this.optionsLists.splice(data.segmentIndex, 1);

    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onSegmentRemoved(data);
  }

  handleSegmentMoved(data = {}) {
    this.update(data.moved);
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onSegmentMoved(data);
  }

  handleOptionAdded(data = {}) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);

    this.callbacks.onOptionAdded(data);
  }

  handleOptionRemoved(data = {}) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onOptionRemoved(data);
  }

  handleOptionMoved(data = {}) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onOptionMoved(data);
  }

  handleOptionLabelChanged(data) {
    this.updateOptions();
    data.options = this.getSegmentOptions(data.segmentIndex);
    this.callbacks.onOptionLabelChanged(data);
  }

  handleTitleChanged(title) {
    this.callbacks.onTitleChanged(title);
  }

  update(moved) {
    const optionsListsClone = [...this.optionsLists];
    moved.forEach((move) => {
      this.optionsLists[move.to] = optionsListsClone[move.from];
    });
  }

  updateOptions() {
    this.optionsLists.forEach((optionslist) => {
      optionslist.update();
    });
  }

  getSegmentTitle(index) {
    let title = null;

    this.segmentsList.forEachChild((child, i) => {
      if (title !== null || i !== index) {
        return;
      }

      if (
        !(child instanceof H5PEditor.Group) ||
        child.field?.name !== 'segments'
      ) {
        return;
      }

      const titleInstance = (child.children ?? []).find(
        (child) => child.field?.name === 'title'
      );

      title = titleInstance?.$input?.get(0).value ?? null;
    });

    return title;
  }

  getSegmentOptions(index) {
    const options = this.optionsLists[index]?.getLabels() ?? [];

    return {
      title: this.getSegmentTitle(index),
      options: options.map((label) => ({ label: label }))
    };
  }

  getCompleteInformation() {
    const information = [];

    for (let i = 0; i < this.optionsLists.length; i++) {
      information.push({
        title: this.getSegmentTitle(i),
        options: this.getSegmentOptions(i)
      });
    }

    return information;
  }
}
