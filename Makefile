build: clean
	babel -d lib src

clean:
	@rm -rf lib tmp/*

test: clean
	mocha --growl --require babel-register --require test/setup.js test/**/*.spec.js

.PHONY: test

test-watch:
	mocha --growl --watch --require babel-register --require test/setup.js test/**/*.spec.js
	make clean
