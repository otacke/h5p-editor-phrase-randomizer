import PhraseRandomizerSolutionsList from '@scripts/h5peditor-phrase-randomizer-solutions-list.js';
import '@styles/h5peditor-phrase-randomizer-solutions-list.scss';

import PhraseRandomizerSolutionSelector from '@scripts/h5peditor-phrase-randomizer-solution-selector.js';
import '@styles/h5peditor-phrase-randomizer-solution-selector.scss';

import PhraseRandomizerTextualEditor from '@scripts/h5peditor-phrase-randomizer-textual-editor.js';
import '@styles/h5peditor-phrase-randomizer-textual-editor.scss';

// Load library
H5PEditor.widgets.PhraseRandomizerSolutionSelector = PhraseRandomizerSolutionSelector;

// Load library
H5PEditor.widgets.PhraseRandomizerSolutionsList = PhraseRandomizerSolutionsList;

// Load library
H5PEditor.PhraseRandomizerTextualEditor = PhraseRandomizerTextualEditor;
