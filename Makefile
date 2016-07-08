default:
	rm -rf src.tmp click_by_voice.zip
	cp -r src src.tmp
	# Chrome Web Store won't take comments in the manifest:
	sed 's|^\s*//.*$$||' src/manifest.json | \
	    sed 's|//[^"]*$$||' > src.tmp/manifest.json
	zip -r click_by_voice.zip src.tmp

clean::
	rm -rf src.tmp click_by_voice.zip
