# mocha-reporter-badge

[![Build status](https://img.shields.io/travis/albanm/mocha-reporter-badge.svg)](https://travis-ci.org/albanm/mocha-reporter-badge)

*A simple mocha reporter that produces a badge inspired by shields.io*

For example the following badge is self served by this project, not by any service provider.

![Mocha tests status](http://albanm.github.io/mocha-reporter-badge/mocha-badge.svg)

## Install

    npm install mocha-reporter-badge

## usage

    mocha --reporter mocha-reporter-badge > badge.svg

You can configure it using environment variables, for example:

    export MOCHA_BADGE_SUBJECT=lint
    export MOCHA_BADGE_OK_COLOR=green
    export MOCHA_BADGE_KO_COLOR=orange
    export MOCHA_BADGE_STYLE=flat