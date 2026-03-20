using ChurchMap.Api.Services;

namespace ChurchMap.Api.Models.DTOs;

public record DiffResultDto(
    List<ChurchElement> NewChurches,
    List<ChurchElement> ClosedChurches
);
