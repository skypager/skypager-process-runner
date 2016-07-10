build:
	babel -d lib src

test:
	mocha --require babel-register --recursive test/

.PHONY: test
