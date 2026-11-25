using Infinity.Toolkit.Handlers;

namespace MeetupPlanner.Extensions;

public static class HandlerContextExtensions
{
    public static RequestHandlerContext<T> Create<T>(T request)
        where T : class
    {
        return new RequestHandlerContext<T>
        {
            Request = request,
            Payload = BinaryData.FromObjectAsJson(request)
        };
    }
}
