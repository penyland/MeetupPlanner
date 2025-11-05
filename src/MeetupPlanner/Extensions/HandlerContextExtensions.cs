using Infinity.Toolkit.Handlers;

namespace MeetupPlanner.Extensions;

public static class HandlerContextExtensions
{
    public static HandlerContext<T> Create<T>(T request)
    {
        return new HandlerContext<T>
        {
            Request = request,
            Body = BinaryData.FromObjectAsJson(request)
        };
    }
}
