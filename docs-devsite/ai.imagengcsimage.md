Project: /docs/reference/js/_project.yaml
Book: /docs/reference/_book.yaml
page_type: reference

{% comment %}
DO NOT EDIT THIS FILE!
This is generated by the JS SDK team, and any local changes will be
overwritten. Changes should be made in the source code at
https://github.com/firebase/firebase-js-sdk
{% endcomment %}

# ImagenGCSImage interface
An image generated by Imagen, stored in a Cloud Storage for Firebase bucket.

This feature is not available yet.

<b>Signature:</b>

```typescript
export interface ImagenGCSImage 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [gcsURI](./ai.imagengcsimage.md#imagengcsimagegcsuri) | string | The URI of the file stored in a Cloud Storage for Firebase bucket. |
|  [mimeType](./ai.imagengcsimage.md#imagengcsimagemimetype) | string | The MIME type of the image; either <code>&quot;image/png&quot;</code> or <code>&quot;image/jpeg&quot;</code>.<!-- -->To request a different format, set the <code>imageFormat</code> property in your [ImagenGenerationConfig](./ai.imagengenerationconfig.md#imagengenerationconfig_interface)<!-- -->. |

## ImagenGCSImage.gcsURI

The URI of the file stored in a Cloud Storage for Firebase bucket.

<b>Signature:</b>

```typescript
gcsURI: string;
```

### Example

`"gs://bucket-name/path/sample_0.jpg"`<!-- -->.

## ImagenGCSImage.mimeType

The MIME type of the image; either `"image/png"` or `"image/jpeg"`<!-- -->.

To request a different format, set the `imageFormat` property in your [ImagenGenerationConfig](./ai.imagengenerationconfig.md#imagengenerationconfig_interface)<!-- -->.

<b>Signature:</b>

```typescript
mimeType: string;
```
