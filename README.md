# Damerau Levenshtein

This is an implementation of the Damerau-Levenshtein edit distance algorithm in JavaScript.<br>
The Damerau-Levenshtein distance is a measure of the similarity between two strings by counting the minimum number of operations (insertions, deletions, substitutions, and transpositions) required to transform one string into another.<br>
This implementation is suitable for use in web applications.

## Installation

You can install this module via [npm](https://www.npmjs.com/@thebugs/damerau-levenshtein). Open your terminal or command prompt and run the
following command:

```sh
npm i @thebugs/damerau-levenshtein
```

## Usage

### Basic Usage

You can calculate the Damerau-Levenshtein distance between two strings by importing the module and using the
DamerauLevenshtein class:

```js
import DamerauLevenshtein from '@thebugs/damerau-levenshtein';

const dl = new DamerauLevenshtein();
const distance = dl.distance('hello', 'world');
console.log(distance); // Output: 4
```

### Custom Costs

This module supports specifying custom costs for insertions, removals, substitutions, and transpositions using the
DamerauLevenshtein class. Here's an example:

```js
import DamerauLevenshtein from '@thebugs/damerau-levenshtein';

const dl = new DamerauLevenshtein({
    insert: 1,
    remove: 0.5,
    substitute: function (from, to) {
        if (from === 'a') return 0.8;
        else return 1;
    },
    transpose: function (backward, forward) {
        if (backward === 'n') return 0.5;
        else return 1;
    }
});

const distance = dl.distance("A string", "Another string");
console.log(distance); // Output: Customized Damerau-Levenshtein distance
```

### Turning off Transposition

You can turn off the Damerau transposition to calculate the standard Levenshtein distance using the DamerauLevenshtein class:

```js
import DamerauLevenshtein from '@thebugs/damerau-levenshtein';

const dl = new DamerauLevenshtein({}, false);
const distance = dl.distance("A string", "Another string");
console.log(distance); // Output: Levenshtein distance
```

### Spell Checker Example

Here's an example of how to use the Damerau-Levenshtein module to implement a simple spelling correction feature for a search bar in a web application:

```html
<input type="text" id="searchInput">
<div id="suggestions"></div>
```

```js
import DamerauLevenshtein from '@thebugs/damerau-levenshtein';

// Initialize the DamerauLevenshtein instance with your custom costs and flags
const dl = new DamerauLevenshtein();

// Get the input and suggestions elements
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');

// Listen for input events on the search bar
searchInput.addEventListener('input', () => {
  const userQuery = searchInput.value;
  const dictionary = ['apple', 'banana', 'orange', 'pear', 'peach', 'pineapple', 'plum', 'strawberry'];

  const correctedSuggestions = dictionary
    .map((suggestion) => ({
      suggestion,
      distance: dl.distance(userQuery, suggestion),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((suggestionObj) => suggestionObj.suggestion);

  suggestions.innerHTML = '';
  correctedSuggestions.forEach((suggestion) => {
    const suggestionElement = document.createElement('div');
    suggestionElement.textContent = suggestion;
    suggestions.appendChild(suggestionElement);
  });
});
```

When the user types in the search input, the code calculates the Damerau-Levenshtein distance between the user's input and a list of possible suggestions. It then sorts the suggestions by distance and displays the corrected suggestions in the suggestions element below the input field.

This example demonstrates how to use the Damerau-Levenshtein module to provide spelling corrections in a web application's search bar. You can customize and extend this concept to fit your specific use case and UI requirements.

### Testing

You can run the unit tests for this module by cloning the [GitHub](https://github.com/chiribuc/damerau-levenshtein) repository and running the following command in your terminal or command prompt:

```sh
npm test
```

### Contributing
We welcome contributions and improvements to this module. If you would like to contribute, please submit a pull request or open an issue on the [GitHub](https://github.com/chiribuc/damerau-levenshtein) repository.
