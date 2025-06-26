/**
 * WordPress dependencies
 */
import { RawHTML, useEffect, useState, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useServerSideRender } from './hook';

function DefaultEmptyResponsePlaceholder( { className } ) {
	return (
		<Placeholder className={ className }>
			{ __( 'Block rendered as empty.' ) }
		</Placeholder>
	);
}

function DefaultErrorResponsePlaceholder( { message, className } ) {
	const errorMessage = sprintf(
		// translators: %s: error message describing the problem
		__( 'Error loading block: %s' ),
		message
	);
	return <Placeholder className={ className }>{ errorMessage }</Placeholder>;
}

function DefaultLoadingResponsePlaceholder( { children, isLoading } ) {
	const [ showLoader, setShowLoader ] = useState( false );

	useEffect( () => {
		if ( ! isLoading ) {
			setShowLoader( false );
			return;
		}

		// Schedule showing the Spinner after 1 second.
		const timeout = setTimeout( () => {
			setShowLoader( true );
		}, 1000 );
		return () => clearTimeout( timeout );
	}, [ isLoading ] );

	return (
		<div style={ { position: 'relative' } }>
			{ showLoader && (
				<div
					style={ {
						position: 'absolute',
						top: '50%',
						left: '50%',
						marginTop: '-9px',
						marginLeft: '-9px',
					} }
				>
					<Spinner />
				</div>
			) }
			<div style={ { opacity: showLoader ? '0.3' : 1 } }>
				{ children }
			</div>
		</div>
	);
}

export default function ServerSideRender( props ) {
	const prevHTMLtRef = useRef( '' );
	const {
		className,
		EmptyResponsePlaceholder = DefaultEmptyResponsePlaceholder,
		ErrorResponsePlaceholder = DefaultErrorResponsePlaceholder,
		LoadingResponsePlaceholder = DefaultLoadingResponsePlaceholder,
		...restProps
	} = props;

	const { html, status, error } = useServerSideRender( restProps );

	// Store the previous successful HTML response to show while loading.
	useEffect( () => {
		if ( html ) {
			prevHTMLtRef.current = html;
		}
	}, [ html ] );

	if ( status === 'loading' ) {
		return (
			<LoadingResponsePlaceholder { ...props } isLoading>
				{ prevHTMLtRef.current && (
					<RawHTML className={ className }>
						{ prevHTMLtRef.current }
					</RawHTML>
				) }
			</LoadingResponsePlaceholder>
		);
	}

	if ( status === 'success' && ! html ) {
		return <EmptyResponsePlaceholder { ...props } />;
	}

	if ( status === 'error' ) {
		return <ErrorResponsePlaceholder message={ error } { ...props } />;
	}

	return <RawHTML className={ className }>{ html }</RawHTML>;
}
