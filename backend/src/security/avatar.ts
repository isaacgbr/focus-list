import { HttpError } from "../utils/http-error.js";

// O cliente rasteriza o recorte em JPEG 256x256. Não aceita SVG, URL ou nome de arquivo.
export function avatarImage(value: unknown) {
  const invalid = () => new HttpError(400, "Envie uma foto JPEG quadrada de 256 pixels, com até 128 KB.");
  if (typeof value !== "string" || value.length > 174764 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw invalid();
  const image = Buffer.from(value, "base64");
  if (image.toString("base64") !== value || image.length > 131072 || image.length < 12 || image.readUInt16BE(0) !== 0xffd8 || image.readUInt16BE(image.length - 2) !== 0xffd9) throw invalid();
  let offset = 2;
  let dimensions = false;
  while (offset + 4 < image.length) {
    if (image[offset++] !== 0xff) throw invalid();
    while (image[offset] === 0xff) offset++;
    const marker = image[offset++];
    if (offset + 2 > image.length) throw invalid();
    const length = image.readUInt16BE(offset);
    if (length < 2 || offset + length > image.length - 2) throw invalid();
    if (marker === 0xc0 || marker === 0xc2) {
      if (length < 8 || image[offset + 2] !== 8 || image.readUInt16BE(offset + 3) !== 256 || image.readUInt16BE(offset + 5) !== 256) throw invalid();
      dimensions = true;
    }
    // A foto é servida apenas como image/jpeg, nunca como documento executável.
    if (marker === 0xda) {
      if (!dimensions || offset + length >= image.length - 2) throw invalid();
      return image;
    }
    offset += length;
  }
  throw invalid();
}
