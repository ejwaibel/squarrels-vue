module.exports = {
	env: {
		amd: true,
		browser: true,
		es6: true,
		node: true,
	},
	extends: ['plugin:vue/essential', '@vue/prettier'],
	// plugins: ['@vue/babel', 'vue'],
	parserOptions: {
		ecmaVersion: 8,
		parser: 'babel-eslint',
		sourceType: 'module',
	},
	globals: {
		browser: true,
	},
	// See https://eslint.org/docs/rules/#possible-errors for rules enabled with eslint:recommended
	rules: {
		'block-scoped-var': 2,
		'class-methods-use-this': [2],
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				exports: 'always-multiline',
				functions: 'always-multiline',
				imports: 'always-multiline',
				objects: 'always-multiline',
			},
		],
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'no-debugger': process.env.NODE_ENV !== 'production' ? 0 : 2,
		'no-dupe-args': 2,
		'no-dupe-keys': 2,
		'no-duplicate-case': 2,
		'no-empty-character-class': 2,
		'no-ex-assign': 2,
		'no-extra-boolean-cast': 2,
		'no-extra-parens': 0,
		'no-extra-semi': 2,
		'no-func-assign': 2,
		'no-inner-declarations': [2, 'both'],
		'no-invalid-regexp': 2,
		'no-irregular-whitespace': 2,
		'no-negated-in-lhs': 2,
		'no-obj-calls': 2,
		'no-regex-spaces': 2,
		'no-sparse-arrays': 2,
		'no-unreachable': 2,
		'use-isnan': 2,
		'valid-jsdoc': 2,
		'valid-typeof': 2,
		'no-unexpected-multiline': 2,
		'accessor-pairs': [
			2,
			{
				getWithoutSet: true,
				setWithoutGet: true,
			},
		],
		'complexity': 0,
		'consistent-return': 0,
		'curly': [2, 'all'],
		'default-case': 0,
		'dot-notation': 2,
		'dot-location': [2, 'property'],
		'eqeqeq': [2, 'smart'],
		'guard-for-in': 0,
		'no-alert': 2,
		'no-caller': 0,
		'no-div-regex': 0,
		'no-else-return': 2,
		'no-empty-function': 1,
		'no-empty-label': 0,
		'no-eq-null': 0,
		'no-eval': 1,
		'no-extend-native': 0,
		'no-extra-bind': 2,
		'no-fallthrough': 2,
		'no-floating-decimal': 0,
		'no-implicit-coercion': [
			2,
			{
				boolean: true,
				number: true,
				string: true,
			},
		],
		'no-implied-eval': 0,
		// "babel/no-invalid-this": 1,
		'no-iterator': 0,
		'no-labels': 2,
		'no-lone-blocks': 0,
		'no-loop-func': 0,
		'no-multi-spaces': [
			2,
			{
				exceptions: {
					Property: true,
					VariableDeclarator: true,
					ImportDeclaration: true,
				},
			},
		],
		'no-multi-str': 0,
		'no-native-reassign': 2,
		'no-new-func': 2,
		'no-new-wrappers': 2,
		'no-new': 0,
		'no-octal-escape': 0,
		'no-octal': 0,
		'no-param-reassign': [0],
		'no-process-env': 0,
		'no-proto': 0,
		'no-redeclare': [2, { builtinGlobals: true }],
		'no-return-assign': [2, 'always'],
		'no-return-await': 1,
		'no-script-url': 2,
		'no-self-compare': 2,
		'no-sequences': 2,
		'no-throw-literal': 2,
		'no-unused-expressions': 0,
		'no-useless-call': 0,
		'no-useless-concat': 1,
		'no-useless-return': 1,
		'no-void': 2,
		'no-warning-comments': 1,
		'no-with': 2,
		'radix': 0,
		'vars-on-top': 2,
		'wrap-iife': [2, 'inside'],
		'yoda': [2, 'never', { exceptRange: true }],
		'strict': [2, 'global'],
		'init-declarations': 0,
		'no-catch-shadow': 2,
		'no-delete-var': 2,
		'no-label-var': 2,
		'no-shadow-restricted-names': 2,
		'no-shadow': 0,
		'no-undef-init': 2,
		'no-undef': 1,
		'no-undefined': 2,
		'no-unused-vars': 1,
		'no-use-before-define': [2, 'nofunc'],
		'callback-return': 0,
		'handle-callback-err': 0,
		'no-mixed-requires': 0,
		'no-new-require': 0,
		'no-path-concat': 0,
		'no-process-exit': 0,
		'no-restricted-modules': 0,
		'no-sync': 0,
		'array-bracket-spacing': [2, 'never', {}],
		'brace-style': [2, '1tbs', {}],
		'camelcase': 0,
		'comma-spacing': [2, { after: true }],
		'comma-style': [2, 'last'],
		'computed-property-spacing': [2, 'never'],
		'consistent-this': [1, 'vm'],
		'eol-last': 2,
		'func-names': 0,
		'func-style': 0,
		'id-length': 0,
		'indent': [2, 'tab', { SwitchCase: 1, ignoredNodes: ['TemplateLiteral'] }],
		'template-curly-spacing': 'off',
		'key-spacing': [
			2,
			{
				afterColon: true,
			},
		],
		'lines-around-comment': [
			2,
			{
				beforeBlockComment: false,
				beforeLineComment: false,
				allowBlockStart: true,
			},
		],
		'linebreak-style': 0,
		'max-nested-callbacks': 0,
		'new-cap': 0,
		'new-parens': 2,
		'newline-after-var': 0,
		'no-array-constructor': 2,
		'no-await-in-loop': 2,
		'no-continue': 0,
		'no-inline-comments': 0,
		'no-lonely-if': 2,
		'no-mixed-spaces-and-tabs': [2, 'smart-tabs'],
		'no-multiple-empty-lines': [2, { max: 3 }],
		'no-nested-ternary': 2,
		'no-new-object': 2,
		'no-spaced-func': 2,
		'no-template-curly-in-string': 2,
		'no-ternary': 0,
		'no-trailing-spaces': 2,
		'no-underscore-dangle': 0,
		'no-unneeded-ternary': 0,
		'object-curly-spacing': [1, 'always', {}],
		'one-var': 0,
		'operator-assignment': [2, 'always'],
		'operator-linebreak': [0, 'before'],
		'padded-blocks': [2, 'never'],
		'padding-line-between-statements': [
			1,
			{
				blankLine: 'always',
				prev: '*',
				next: 'return',
			},
			{
				blankLine: 'always',
				prev: '*',
				next: 'if',
			},
			{
				blankLine: 'always',
				prev: 'if',
				next: '*',
			},
			{
				blankLine: 'always',
				prev: '*',
				next: 'try',
			},
			{
				blankLine: 'always',
				prev: 'try',
				next: '*',
			},
			{
				blankLine: 'always',
				prev: ['const', 'let', 'var'],
				next: '*',
			},
			{
				blankLine: 'any',
				prev: ['const', 'let', 'var'],
				next: ['const', 'let', 'var'],
			},
			{
				blankLine: 'always',
				prev: 'directive',
				next: '*',
			},
			{
				blankLine: 'any',
				prev: 'directive',
				next: 'directive',
			},
		],
		'quote-props': [2, 'consistent'],
		'quotes': [2, 'single', { avoidEscape: true }],
		'id-match': 0,
		'semi-spacing': [2, { after: true }],
		'semi': 2,
		'sort-vars': 0,
		'space-after-keywords': 0,
		'space-before-blocks': [2, 'always'],
		'space-before-function-paren': [2, 'never'],
		'space-in-parens': [2, 'never'],
		'space-infix-ops': [2, { int32Hint: true }],
		'space-unary-ops': 0,
		'spaced-comment': [2, 'always', {}],
		'wrap-regex': 0,
		'arrow-parens': [2, 'as-needed'],
		'arrow-spacing': [
			2,
			{
				before: true,
				after: true,
			},
		],
		'constructor-super': 2,
		'generator-star-spacing': 0,
		'no-class-assign': 0,
		'no-const-assign': 2,
		'no-this-before-super': 0,
		'no-var': 2,
		'object-shorthand': 0,
		'prefer-const': 2,
		'prefer-spread': 2,
		'prefer-reflect': 0,
		'require-await': 2,
		'require-yield': 0,
		'max-depth': 0,
		// 'max-len': ["error", {"code": 100, "ignoreUrls": true}],
		'max-params': 0,
		'max-statements': 0,
		'no-bitwise': 0,
		'no-plusplus': 0,
		'keyword-spacing': [
			2,
			{
				before: true,
				after: true,
			},
		],
		'newline-per-chained-call': 2,

		/** Prettier eslint overrides */
		'prettier/prettier': [
			'warn',
			{
				singleQuote: true,
				trailingComma: 'all',
				tabWidth: 2,
				useTabs: true,
				quoteProps: 'consistent',
			},
		],

		/**
		 * Vue.js ESLint Overrides from vue/recommended
		 */

		'vue/attributes-order': 1,
		// https://github.com/vuejs/eslint-plugin-vue/blob/master/docs/rules/html-indent.md
		'vue/html-indent': [
			1,
			'tab',
			{
				attribute: 1,
				closeBracket: 0,
				alignAttributesVertically: true,
				ignores: [],
			},
		],
		'vue/html-quotes': [2, 'double'],
		'vue/html-self-closing': 0,
		'vue/order-in-components': 1,
		// https://github.com/vuejs/eslint-plugin-vue/blob/master/docs/rules/name-property-casing.md
		'vue/name-property-casing': [1, 'kebab-case'],
		// https://github.com/vuejs/eslint-plugin-vue/blob/master/docs/rules/no-parsing-error.md
		'vue/no-parsing-error': [
			2,
			{
				'x-invalid-end-tag': false,
			},
		],
	},
};
