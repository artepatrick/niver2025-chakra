import { Response, Log } from "node-api-rest-framework";
import { getAllConfirmations } from "../../../app/niver2025/dashboardBackend";
import { syncPlaylist } from "../spotifyPlaylistSync";

/**
 * @openapi
 * /api/niver2025/syncPlaylist:
 *   post:
 *     description: Sync the Spotify playlist with confirmed music suggestions
 *     responses:
 *       200:
 *         description: Playlist sync result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the sync was successful
 *                 addedTracks:
 *                   type: number
 *                   description: Number of tracks added to the playlist
 */
export class SyncPlaylistController {
  async post(req, res) {
    try {
      // Get all confirmations
      const confirmations = await getAllConfirmations();

      // Sync the playlist
      const result = await syncPlaylist(confirmations);

      Response.success(res, result);
    } catch (e) {
      Log.error(
        `ERRO: class SyncPlaylistController -> ${e?.message}\nstack\n${e?.stack}`
      );
      Response.error(res, "Error syncing playlist");
    }
  }
}
