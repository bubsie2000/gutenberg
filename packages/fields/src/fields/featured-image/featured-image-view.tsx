/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

export const FeaturedImageView = ( {
	item,
	view,
}: DataViewRenderFieldProps< BasePost > ) => {
	const mediaId = item.featured_media;

	const media = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return mediaId ? getEntityRecord( 'root', 'media', mediaId ) : null;
		},
		[ mediaId ]
	);

	// Thumbnail will exist almost for sure, but better have a fallback anyway.
	const thumbnailURL =
		media?.media_details?.sizes?.thumbnail?.source_url || media?.source_url;
	const url = view ? media?.source_url : thumbnailURL;

	// @ts-ignore layout exists on ViewGrid; not sure what the problem is here.
	const columnNumberSetting = view?.layout?.previewSize || 0;
	let sizes =
		'(max-width: 480px) 100vw, (max-width: 1080px) 50vw, (max-width: 1440px) 30vw, (max-width: 1920px) 25vw, 20vw';
	if ( columnNumberSetting ) {
		sizes = `(max-width: 480px) 100vw, ${ 100 / columnNumberSetting }vw`;
	}

	if ( url ) {
		return (
			<img
				className="fields-controls__featured-image-image"
				src={ url }
				alt=""
				srcSet={
					view && media?.media_details?.sizes
						? Object.values( media.media_details.sizes )
								.map(
									( size: any ) =>
										`${ size.source_url } ${ size.width }w`
								)
								.join( ', ' )
						: undefined
				}
				sizes={ view && sizes }
			/>
		);
	}

	return <span className="fields-controls__featured-image-placeholder" />;
};
