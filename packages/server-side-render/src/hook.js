/**
 * WordPress dependencies
 */
import { debounce } from '@wordpress/compose';
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __experimentalSanitizeBlockAttributes } from '@wordpress/blocks';

const EMPTY_OBJECT = {};

export function rendererPath( block, attributes = null, urlQueryArgs = {} ) {
	return addQueryArgs( `/wp/v2/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
		...urlQueryArgs,
	} );
}

export function removeBlockSupportAttributes( attributes ) {
	const {
		backgroundColor,
		borderColor,
		fontFamily,
		fontSize,
		gradient,
		textColor,
		className,
		...restAttributes
	} = attributes;

	const { border, color, elements, spacing, typography, ...restStyles } =
		attributes?.style || EMPTY_OBJECT;

	return {
		...restAttributes,
		style: restStyles,
	};
}

export function useServerSideRender( args ) {
	const [ response, setResponse ] = useState( { status: 'idle' } );
	const shouldDebounceRef = useRef( false );

	const {
		attributes,
		block,
		skipBlockSupportAttributes = false,
		httpMethod = 'GET',
		urlQueryArgs,
	} = args;

	let sanitizedAttributes =
		attributes &&
		__experimentalSanitizeBlockAttributes( block, attributes );

	if ( skipBlockSupportAttributes ) {
		sanitizedAttributes =
			removeBlockSupportAttributes( sanitizedAttributes );
	}

	// If httpMethod is 'POST', send the attributes in the request body instead of the URL.
	// This allows sending a larger attributes object than in a GET request, where the attributes are in the URL.
	const isPostRequest = 'POST' === httpMethod;
	const urlAttributes = isPostRequest ? null : sanitizedAttributes;
	const path = rendererPath( block, urlAttributes, urlQueryArgs );
	const body = isPostRequest
		? JSON.stringify( { attributes: sanitizedAttributes ?? null } )
		: undefined;

	useEffect( () => {
		const controller = new AbortController();
		const debouncedFetch = debounce(
			function () {
				{
					setResponse( { status: 'loading' } );

					apiFetch( {
						path,
						method: isPostRequest ? 'POST' : 'GET',
						body,
						headers: {
							'Content-Type': 'application/json',
						},
						signal: controller.signal,
					} )
						.then( ( res ) => {
							setResponse( {
								status: 'success',
								html: res ? res.rendered : '',
							} );
						} )
						.catch( ( error ) => {
							// The request was aborted, do not update the response.
							if ( error.name === 'AbortError' ) {
								return;
							}

							setResponse( {
								status: 'error',
								error: error.message,
							} );
						} )
						.finally( () => {
							// Debounce requests after first fetch.
							shouldDebounceRef.current = true;
						} );
				}
			},
			shouldDebounceRef.current ? 500 : 0
		);

		debouncedFetch();

		return () => {
			controller.abort();
			debouncedFetch.cancel();
		};
	}, [ path, isPostRequest, body ] );

	return response;
}
