module.exports = {
    "env": {
        "browser": true,
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 6
    },
    "globals": {
        "delicious": false
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "warn",
            4
        ],
        "linebreak-style": [
            "off",
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": [
            "off"
        ]
    }
};