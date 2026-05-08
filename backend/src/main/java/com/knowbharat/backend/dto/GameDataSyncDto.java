package com.knowbharat.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class GameDataSyncDto {
    private String key;     // "unlocked_symbols_list" or "map_explored_nodes"
    private List<?> value;  // Can be List<Integer> for symbols or List<String> for map
}
