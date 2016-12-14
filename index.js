// tooling
const postcss = require('postcss');
const parser = require('postcss-selector-parser');

// plugin
module.exports = postcss.plugin('postcss-pseudo-class-any-link', ({
	prefix = ''
} = {}) => {
	// dashed prefix
	const dashedPrefix = prefix ? `-${ prefix }-` : '';

	// any-link value
	const anyLinkValue = `:${ dashedPrefix }any-link`;

	// selector matcher
	const selectorMatch = new RegExp(`${ dashedPrefix }any-link`);

	return (css) => {
		// walk each matching rule
		css.walkRules(selectorMatch, (rule) => {
			const rawSelector = rule.raws.selector && rule.raws.selector.raw || rule.selector;

			// workaround for https://github.com/postcss/postcss-selector-parser/issues/28#issuecomment-171910556
			if (rawSelector[rawSelector.length - 1] !== ':') {
				// update the selector
				rule.selector = parser((selectors) => {
					// cache variables
					let node;
					let nodeIndex;
					let selector;
					let selectorLink;
					let selectorVisited;

					// cache the selector index
					let selectorIndex = -1;

					// for each selector
					while (selector = selectors.nodes[++selectorIndex]) {
						// reset the node index
						nodeIndex = -1;

						// for each node
						while (node = selector.nodes[++nodeIndex]) {
							// if the node value matches the any-link value
							if (node.value === anyLinkValue) {
								// clone the selector
								selectorLink = selector.clone();
								selectorVisited = selector.clone();

								// update the matching clone values
								selectorLink.nodes[nodeIndex].value = ':link';
								selectorVisited.nodes[nodeIndex].value = ':visited';

								// replace the selector with the clones and roll back the selector index
								selectors.nodes.splice(selectorIndex--, 1, selectorLink, selectorVisited);

								// stop updating the selector
								break;
							}
						}
					}
				}).process(rawSelector).result;
			}
		});
	};
});

// override plugin#process
module.exports.process = function (cssString, pluginOptions, processOptions) {
	return postcss([
		1 in arguments ? module.exports(pluginOptions) : module.exports()
	]).process(cssString, processOptions);
};
