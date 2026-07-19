default:
	rm -rf src.tmp click_by_voice.zip
	cp -r src src.tmp
	# Chrome Web Store won't take comments in the manifest:
	sed 's|^\s*//.*$$||' src/manifest.json | \
	    sed 's|//[^"]*$$||' > src.tmp/manifest.json
	zip -r click_by_voice.zip src.tmp

clean::
	rm -rf src.tmp click_by_voice.zip

# Run the automatic (Playwright) tests.  The PATH extension is needed
# on Windows, where node is not on Cygwin bash's default PATH; it is
# harmless elsewhere.
test:
	PATH="$$PATH:/cygdrive/c/Program Files/nodejs" npx playwright test
