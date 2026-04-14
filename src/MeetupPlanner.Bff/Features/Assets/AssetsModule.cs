using Azure.Storage.Blobs;
using Infinity.Toolkit.FeatureModules;

namespace MeetupPlanner.Bff.Features.Assets;

internal class AssetsModule : WebFeatureModule
{
    public override IModuleInfo ModuleInfo { get; } = new FeatureModuleInfo(typeof(AssetsModule).FullName, typeof(AssetsModule).Assembly.GetName().Version?.ToString());

    public override void RegisterModule(IHostApplicationBuilder builder)
    {
        builder.AddAzureBlobServiceClient(connectionName: "assets");
    }

    public override void MapEndpoints(WebApplication app)
    {
        var group = app.MapGroup("/assets").WithTags("Assets");

        group.MapGet("/{*path}", async (string path, BlobServiceClient blobClient) =>
        {
            var container = blobClient.GetBlobContainerClient("assets");
            var blob = container.GetBlobClient(path);

            if (!await blob.ExistsAsync())
                return Results.NotFound();

            var stream = await blob.OpenReadAsync();
            //var contentType = MimeTypes.GetMimeType(path);

            return Results.File(stream, "image/png" /*contentType*/);
        });

    }
}
