import { catalogoVolumes } from "../../catalogo.js";

const gallery = document.querySelector(".volume-gallery");
const volumes = catalogoVolumes
  .filter((volume) => volume.mangaId === "bleach")
  .sort((a, b) => a.volumeNumber - b.volumeNumber);

if (gallery) {
  gallery.innerHTML = volumes.map((volume) => `
    <a class="volume-card" href="${volume.pageUrl.split("/").pop()}">
      <img src="${volume.cover.split("/").pop()}" alt="Capa do volume ${volume.volumeNumber} de Bleach" loading="lazy">
      <span>Volume ${volume.volumeNumber}</span>
    </a>`).join("");
}
